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
        if (error) { console.error(error); setLocations(MOCK_LOCATIONS) }
        else {
          const unique = [...new Set((data ?? []).map(r => r.lokasi))].sort()
          setLocations(unique.length ? unique : MOCK_LOCATIONS)
        }
        setLoading(false)
      })
  }, [])

  return { locations, loading }
}

// Ambil 24 data terbaru untuk satu lokasi + subscribe realtime
export function useLocationData(lokasi) {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!lokasi) return
    if (!supabase) {
      setRows(buildMockRows(lokasi))
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('air_quality')
      .select('*')
      .eq('lokasi', lokasi)
      .order('created_at', { ascending: false })
      .limit(24)
    if (error) { console.error(error); setRows(buildMockRows(lokasi)) }
    else setRows((data ?? []).reverse())
    setLoading(false)
  }, [lokasi])

  useEffect(() => {
    setLoading(true)
    fetch()
    if (!supabase) return
    const channel = supabase
      .channel(`aq-${lokasi}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'air_quality',
        filter: `lokasi=eq.${lokasi}`,
      }, payload => {
        setRows(prev => {
          const next = [...prev, payload.new]
          return next.slice(-24)
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [lokasi, fetch])

  // latest row snapshot
  const latest = rows.at(-1) ?? {}
  return { rows, latest, loading }
}
