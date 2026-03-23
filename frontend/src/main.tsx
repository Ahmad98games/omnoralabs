import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
// import { trackEvent } from './api/client'
import './index.css'

// 🚀 OMNORA PLATFORM BOOTSTRAP: Explicit Initialization (v4)
import { initializePlatformRegistry } from './platform/client/bootstrap';
initializePlatformRegistry();

import { MediaStoreProvider } from './context/MediaStoreContext';
import { BuilderProvider } from './context/BuilderContext';
import { ElementControlProvider } from './platform/library/modules/ElementControlLayer';

function ensureSessionId() {
  let sid = localStorage.getItem('sid')
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('sid', sid)
  }
  return sid
}

const sessionId = ensureSessionId()
// trackEvent({ type: 'app_start', path: location.pathname, sessionId, referrer: document.referrer, screen: { width: screen.width, height: screen.height } })

// 🛡️ Global Diagnostics
window.onerror = (message, source, lineno, colno, error) => {
  /*
  trackEvent({
    type: 'runtime_error',
    path: location.pathname,
    sessionId,
    payload: {
      message: String(message),
      source,
      lineno,
      colno,
      stack: error?.stack
    }
  });
  */
};

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { crashed: boolean; error: string }
> {
  state = { crashed: false, error: '' }

  static getDerivedStateFromError(error: Error) {
    return { crashed: true, error: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RootCrash]', error.message, info.componentStack)
  }

  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#FAFAF9', gap: '16px', padding: '24px', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '18px', color: '#1A1916', margin: 0 }}>Something went wrong</h2>
          <p style={{ fontSize: '14px', color: '#6B6863', margin: 0 }}>{this.state.error}</p>
          <button
            onClick={() => {
              Object.keys(localStorage)
                .filter(k => k.startsWith('omnora-'))
                .forEach(k => localStorage.removeItem(k))
              window.location.href = '/'
            }}
            style={{
              padding: '10px 20px', background: '#FF6B35', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer',
            }}
          >
            Clear cache and reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element missing in index.html')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <MediaStoreProvider>
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