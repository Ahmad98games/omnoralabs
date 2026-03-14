import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { trackEvent } from './api/client'
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
trackEvent({ type: 'app_start', path: location.pathname, sessionId, referrer: document.referrer, screen: { width: screen.width, height: screen.height } })

// 🛡️ Global Diagnostics
window.onerror = (message, source, lineno, colno, error) => {
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
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MediaStoreProvider>
        <BuilderProvider initialData={{}} isPreview={false}>
          <ElementControlProvider>
            <App />
          </ElementControlProvider>
        </BuilderProvider>
      </MediaStoreProvider>
    </BrowserRouter>
  </React.StrictMode>
)