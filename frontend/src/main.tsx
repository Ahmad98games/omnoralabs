import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

import { MediaStoreProvider } from './context/MediaStoreContext'
import { BuilderProvider } from './context/BuilderContext'
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
          fontFamily: 'system-ui, sans-serif',
          background: '#FAFAF9',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <h2 style={{ fontSize: '18px', color: '#1A1916', margin: 0, fontWeight: 500 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '13px', color: '#6B6863', margin: 0, maxWidth: '400px' }}>
            {this.state.error}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                border: '1px solid #E8E6E1',
                borderRadius: '6px',
                background: 'white',
                fontSize: '13px',
                cursor: 'pointer',
                color: '#1A1916',
              }}
            >
              Reload page
            </button>
            <button
              onClick={() => {
                try {
                  // Scoped clear — only omnora keys, never auth tokens
                  Object.keys(localStorage)
                    .filter(k => k.startsWith('omnora-') || k.includes('omnora'))
                    .forEach(k => localStorage.removeItem(k))
                } catch { /* ignore */ }
                window.location.href = '/'
              }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: '#FF6B35',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Clear cache and restart
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
            {/*
              BuilderProvider is kept here so builder context is available app-wide.
              App.tsx must NOT re-wrap with BuilderProvider — doing so creates
              a double context that causes state desync between builder and storefront.
            */}
            <BuilderProvider initialData={{}} isPreview={false}>
              <ElementControlProvider>
                <App />
              </ElementControlProvider>
            </BuilderProvider>
          </MediaStoreProvider>
        </BrowserRouter>
      </RootErrorBoundary>
    </React.StrictMode>
  )
}