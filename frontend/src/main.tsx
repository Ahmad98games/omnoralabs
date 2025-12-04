import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Correctly imports BrowserRouter
import App from './App'
import { trackEvent } from './api/client'
import './styles/theme.css'
import './index.css'

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 🚀 All routes defined in App.tsx (including /about) will work because App is wrapped in BrowserRouter */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)