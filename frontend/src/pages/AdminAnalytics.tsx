import { useEffect, useState } from 'react'
import client from '../api/client'

export default function AdminAnalytics() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    let isMounted = true
    async function load() {
      setLoading(true)
      const res = await client.get('/events', { params: { type: type || undefined, sessionId: sessionId || undefined, limit: 200 } })
      if (!isMounted) return
      setEvents(res.data?.events || [])
      setLoading(false)
    }
    load()
    return () => { isMounted = false }
  }, [type, sessionId])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 1.5rem 3rem' }}>
      <h1 className="page-title">Analytics Events</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Filter by type (e.g., page_view)" className="form-input" value={type} onChange={e => setType(e.target.value)} />
        <input placeholder="Filter by sessionId" className="form-input" value={sessionId} onChange={e => setSessionId(e.target.value)} />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--surface-color)' }}>
          {events.map(ev => (
            <div key={ev._id} style={{ padding: 12, borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 8 }}>
              <div><strong>{ev.type}</strong><div style={{ color: 'var(--light-text-color)' }}>{new Date(ev.createdAt).toLocaleString()}</div></div>
              <div>Session: <span style={{ color: 'var(--light-text-color)' }}>{ev.sessionId || '-'}</span></div>
              <div>Path: <span style={{ color: 'var(--light-text-color)' }}>{ev.path || '-'}</span></div>
              <div style={{ color: 'var(--light-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{JSON.stringify(ev.payload) || '-'}</div>
            </div>
          ))}
          {events.length === 0 && <div style={{ padding: 12, color: 'var(--light-text-color)' }}>No events found.</div>}
        </div>
      )}
    </div>
  )
}

