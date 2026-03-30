import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

import { MediaStoreProvider } from './context/MediaStoreContext'
import { ElementControlProvider } from './platform/library/modules/ElementControlLayer'

// Session ID — safe, runs client-side only
function ensureSessionId() {
  try {
    let sid = localStorage.getItem('sid')
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('sid', sid)
    }
    return sid
  } catch {
    return 'anonymous'
  }
}

ensureSessionId()

// Platform registry init — wrapped so a failure never prevents React from mounting
function safePlatformInit() {
  try {
    // Lazy import so a crash here does not block the render tree
    import('./platform/client/bootstrap').then(({ initializePlatformRegistry }) => {
      initializePlatformRegistry()
    }).catch((err) => {
      console.error('[Omnora] Platform registry init failed — builder may have limited functionality:', err)
    })
  } catch (err) {
    console.error('[Omnora] Platform bootstrap import failed:', err)
  }
}

safePlatformInit()

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { crashed: boolean; error: string }
> {
  state = { crashed: false, error: '' }

  static getDerivedStateFromError(error: Error) {
    return { crashed: true, error: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RootCrash]', error.message)
    console.error('[ComponentStack]', info.componentStack)
  }

  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh', 
          fontFamily: "'Inter', sans-serif",
          background: '#000000',
          color: '#FFFFFF',
          gap: '24px',
          padding: '40px',
          textAlign: 'center',
          letterSpacing: '-0.02em'
        }}>
          <div style={{ fontSize: '48px', opacity: 0.2, fontWeight: 900 }}>CRITICAL_KERNEL_PANIC</div>
          <h2 style={{ fontSize: '24px', color: '#FFFFFF', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
            System Interrupt
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0, maxW: '400px', lineHeight: 1.6 }}>
            {this.state.error}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                background: 'white',
                fontSize: '11px',
                cursor: 'pointer',
                color: 'black',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              RELOAD_KERNEL
            </button>
            <button
              onClick={() => {
                try {
                  Object.keys(localStorage)
                    .filter(k => k.startsWith('omnora-') || k.includes('omnora'))
                    .forEach(k => localStorage.removeItem(k))
                } catch { /* ignore */ }
                window.location.href = '/'
              }}
              style={{
                padding: '12px 24px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                background: 'transparent',
                color: 'white',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              PURGE_CACHE_RESTART
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  // Cannot use React here — DOM is broken
  document.body.style.cssText = 'margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;'
  document.body.innerHTML = '<div style="color:#DC2626;font-size:14px;text-align:center;padding:24px;">Critical error: #root element is missing from index.html</div>'
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <BrowserRouter>
          <MediaStoreProvider>
            <ElementControlProvider>
              <App />
            </ElementControlProvider>
          </MediaStoreProvider>
        </BrowserRouter>
      </RootErrorBoundary>
    </React.StrictMode>
  )
}