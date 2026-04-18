import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { buildMockRows, MOCK_LOCATIONS } from '../lib/utils'

// Ambil daftar lokasi unik dari tabel air_quality
export function useLocations() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLocations(MOCK_LOCATIONS)
      setLoading(false)
      return
    }
    supabase
      .from('air_quality')
      .select('lokasi')
      .then(({ data, error }) => {
        if (error) { 
          console.error('Error fetching locations:', error)
          setLocations(MOCK_LOCATIONS)
        } else {
          const unique = [...new Set((data ?? []).map(r => r.lokasi))].filter(Boolean).sort()
          setLocations(unique.length ? unique : MOCK_LOCATIONS)
        }
        setLoading(false)
      })
  }, [])

  return { locations, loading }
}

// Hook baru: Ambil HANYA data terbaru untuk preview card (lebih ringan)
export function useLatestData(lokasi) {
  const [latest, setLatest] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lokasi) return
    
    async function fetchLatest() {
      if (!supabase) {
        const mock = buildMockRows(lokasi)
        setLatest(mock[mock.length - 1] || {})
        setLoading(false)
        return
      }

      setLoading(true)
      const { data, error } = await supabase
        .from('air_quality')
        .select('*')
        .eq('lokasi', lokasi)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching latest:', error)
        setLatest({})
      } else {
        setLatest(data || {})
      }
      setLoading(false)
    }

    fetchLatest()

    if (!supabase) return

    // Subscribe untuk update realtime pada data terbaru
    const channel = supabase
      .channel(`latest-${lokasi}`, {
        config: { broadcast: { self: true } }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'air_quality',
          filter: `lokasi=eq.${lokasi}`
        },
        (payload) => {
          setLatest(payload.new)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [lokasi])

  return { latest, loading }
}

// Ambil 24 data terbaru untuk satu lokasi + subscribe realtime
export function useLocationData(lokasi) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!lokasi) return
    if (!supabase) {
      setRows(buildMockRows(lokasi))
      setLoading(false)
      return
    }
    
    setLoading(true)
    const { data, error } = await supabase
      .from('air_quality')
      .select('*')
      .eq('lokasi', lokasi)
      .order('created_at', { ascending: false })
      .limit(1000)
    
    if (error) {
      console.error('Error fetching data:', error)
      setRows(buildMockRows(lokasi))
    } else {
      setRows((data ?? []).reverse())
    }
    setLoading(false)
  }, [lokasi])

  useEffect(() => {
    if (!lokasi) return
    
    fetch()
    
    if (!supabase) return

    // PERBAIKAN: on() harus dipanggil SEBELUM subscribe()
    const channel = supabase
      .channel(`aq-${lokasi}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'air_quality',
          filter: `lokasi=eq.${lokasi}`
        },
        (payload) => {
          console.log('Realtime insert:', payload)
          setRows((prev) => {
            const next = [...prev, payload.new]
            return next.slice(-1000)
          })
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [lokasi, fetch])

  // latest row snapshot
  const latest = rows.length > 0 ? rows[rows.length - 1] : {}
  return { rows, latest, loading }
}