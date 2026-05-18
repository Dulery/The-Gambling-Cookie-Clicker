import { useAuth } from 'react-oidc-context'
import Game from './Game.jsx'

export default function App() {
  const auth = useAuth()

  if (auth.isLoading) {
    return (
      <div className="centered">
        <div className="spinner" />
        <p>Chargement...</p>
      </div>
    )
  }

  if (auth.error) {
    return (
      <div className="centered">
        <h2 style={{ color: 'var(--red)' }}>Erreur d'authentification</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>
          {auth.error.message}
        </p>
        <button className="btn-primary" onClick={() => auth.signinRedirect()}>
          Réessayer
        </button>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="centered login-page">
        <div className="cookie-logo">🍪</div>
        <h1>Cookie Clicker</h1>
        <p>Connectez-vous pour sauvegarder votre progression</p>
        <button className="btn-primary" onClick={() => auth.signinRedirect()}>
          Se connecter
        </button>
        <p className="login-hint">Google ou email / mot de passe</p>
      </div>
    )
  }

  return (
    <Game
      user={auth.user}
      onLogout={() => auth.signoutRedirect()}
    />
  )
}
