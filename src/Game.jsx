import { useState, useEffect, useRef } from 'react'
import { saveScore, loadScore } from './firebase.js'

const UPGRADES = [
  { id: 'cursor',  name: '🖱️ Cursor',   desc: '+1 cookie/sec',    baseCost: 50,    cps: 1    },
  { id: 'grandma', name: '👵 Mamie',    desc: '+5 cookies/sec',   baseCost: 200,   cps: 5    },
  { id: 'farm',    name: '🌾 Ferme',    desc: '+20 cookies/sec',  baseCost: 800,   cps: 20   },
  { id: 'mine',    name: '⛏️ Mine',     desc: '+100 cookies/sec', baseCost: 3000,  cps: 100  },
  { id: 'factory', name: '🏭 Usine',    desc: '+500 cookies/sec', baseCost: 12000, cps: 500  },
  { id: 'portal',  name: '🌀 Portail',  desc: '+2k cookies/sec',  baseCost: 50000, cps: 2000 },
]

function getUpgradeCost(upgrade, owned) {
  return Math.floor(upgrade.baseCost * Math.pow(1.15, owned))
}

function fmt(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9)  return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6)  return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}

export default function Game({ user, onLogout }) {
  const [cookies, setCookies]         = useState(0)
  const [totalCookies, setTotal]      = useState(0)
  const [owned, setOwned]             = useState({})
  const [cps, setCps]                 = useState(0)
  const [clicking, setClicking]       = useState(false)
  const [loaded, setLoaded]           = useState(false)
  const [saving, setSaving]           = useState(false)
  const [floats, setFloats]           = useState([])

  const cookiesRef = useRef(0)
  const totalRef   = useRef(0)
  const ownedRef   = useRef({})
  const saveTimer  = useRef(null)

  const userId = user?.profile?.sub

  // Sync refs with state so the debounced save always has latest values
  useEffect(() => { cookiesRef.current = cookies }, [cookies])
  useEffect(() => { totalRef.current = totalCookies }, [totalCookies])
  useEffect(() => { ownedRef.current = owned }, [owned])

  // Load save from Firebase
  useEffect(() => {
    if (!userId) return
    loadScore(userId)
      .then(data => {
        if (data) {
          setCookies(data.cookies ?? 0)
          setTotal(data.totalCookies ?? 0)
          setOwned(data.owned ?? {})
        }
      })
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [userId])

  // Recalculate CPS whenever upgrades change
  useEffect(() => {
    const total = UPGRADES.reduce((sum, u) => sum + (owned[u.id] || 0) * u.cps, 0)
    setCps(total)
  }, [owned])

  // Passive income loop
  useEffect(() => {
    if (cps <= 0 || !loaded) return
    const interval = setInterval(() => {
      setCookies(c => c + cps)
      setTotal(t => t + cps)
    }, 1000)
    return () => clearInterval(interval)
  }, [cps, loaded])

  const scheduleSave = () => {
    if (!userId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await saveScore(userId, {
          cookies: cookiesRef.current,
          totalCookies: totalRef.current,
          owned: ownedRef.current,
          savedAt: new Date().toISOString(),
        })
      } catch (e) {
        console.error('Erreur de sauvegarde:', e)
      } finally {
        setSaving(false)
      }
    }, 4000)
  }

  const handleClick = (e) => {
    setCookies(c => c + 1)
    setTotal(t => t + 1)
    setClicking(true)
    setTimeout(() => setClicking(false), 100)

    // Floating +1 animation
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now() + Math.random()
    setFloats(f => [...f, { id, x, y }])
    setTimeout(() => setFloats(f => f.filter(fl => fl.id !== id)), 900)

    scheduleSave()
  }

  const buyUpgrade = (upgrade) => {
    const count = owned[upgrade.id] || 0
    const cost  = getUpgradeCost(upgrade, count)
    if (cookies < cost) return
    setCookies(c => c - cost)
    setOwned(o => ({ ...o, [upgrade.id]: count + 1 }))
    scheduleSave()
  }

  if (!loaded) {
    return (
      <div className="centered">
        <div className="spinner" />
        <p>Chargement de la partie...</p>
      </div>
    )
  }

  const picture = user?.profile?.picture
  const name    = user?.profile?.name || user?.profile?.email || 'Joueur'

  return (
    <div className="game">
      {/* Header */}
      <header className="game-header">
        <div className="user-info">
          {picture && <img src={picture} alt="avatar" className="avatar" referrerPolicy="no-referrer" />}
          <span className="user-name">{name}</span>
          {saving && <span className="saving-badge">💾 Sauvegarde…</span>}
        </div>
        <button className="btn-logout" onClick={onLogout}>Déconnexion</button>
      </header>

      <main className="game-main">
        {/* Cookie zone */}
        <section className="cookie-zone">
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{fmt(cookies)}</span>
              <span className="stat-label">cookies</span>
            </div>
            {cps > 0 && (
              <div className="stat">
                <span className="stat-value">{fmt(cps)}</span>
                <span className="stat-label">par seconde</span>
              </div>
            )}
          </div>

          <div className="cookie-wrapper" onClick={handleClick}>
            <button className={`cookie-btn ${clicking ? 'clicked' : ''}`} aria-label="Cliquer">
              🍪
            </button>
            {floats.map(f => (
              <span
                key={f.id}
                className="float-text"
                style={{ left: f.x, top: f.y }}
              >
                +1
              </span>
            ))}
          </div>

          <p className="total-label">Total cuit : {fmt(totalCookies)} cookies</p>
        </section>

        {/* Upgrades panel */}
        <aside className="upgrades">
          <h2 className="upgrades-title">Améliorations</h2>
          {UPGRADES.map(upgrade => {
            const count     = owned[upgrade.id] || 0
            const cost      = getUpgradeCost(upgrade, count)
            const canAfford = cookies >= cost
            return (
              <button
                key={upgrade.id}
                className={`upgrade-item ${canAfford ? 'affordable' : 'expensive'}`}
                onClick={() => buyUpgrade(upgrade)}
                disabled={!canAfford}
              >
                <span className="upgrade-icon">{upgrade.name.split(' ')[0]}</span>
                <div className="upgrade-info">
                  <span className="upgrade-name">{upgrade.name.slice(upgrade.name.indexOf(' ') + 1)}</span>
                  <span className="upgrade-desc">{upgrade.desc}</span>
                </div>
                <div className="upgrade-meta">
                  <span className="upgrade-cost">{fmt(cost)} 🍪</span>
                  {count > 0 && <span className="upgrade-count">×{count}</span>}
                </div>
              </button>
            )
          })}
        </aside>
      </main>
    </div>
  )
}
