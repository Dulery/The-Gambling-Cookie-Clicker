import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import './index.css'

const oidcConfig = {
  authority: import.meta.env.VITE_ZITADEL_AUTHORITY,
  client_id: import.meta.env.VITE_ZITADEL_CLIENT_ID,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  scope: 'openid profile email',
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, '/')
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
    <Analytics />
  </React.StrictMode>
)
