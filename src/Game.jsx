import { useState, useEffect, useRef } from 'react'
import { saveScore, loadScore, getLeaderboard } from './firebase.js'
import Casino from './Casino.jsx'
import Bank from './Bank.jsx'
import Life, { getDefaultAssets } from './Life.jsx'

const UPGRADES = [
  // ── Passifs ──
  { id: 'cursor',    name: '🖱️ Cursor',       desc: '+1 cookie/sec',     baseCost: 150,       cps: 1       },
  { id: 'grandma',   name: '👵 Mamie',         desc: '+5 cookies/sec',    baseCost: 600,       cps: 5       },
  { id: 'farm',      name: '🌾 Ferme',         desc: '+20 cookies/sec',   baseCost: 2500,      cps: 20      },
  { id: 'mine',      name: '⛏️ Mine',          desc: '+100 cookies/sec',  baseCost: 10000,     cps: 100     },
  { id: 'factory',   name: '🏭 Usine',         desc: '+500 cookies/sec',  baseCost: 40000,     cps: 500     },
  { id: 'portal',    name: '🌀 Portail',       desc: '+2k cookies/sec',   baseCost: 200000,    cps: 2000    },
  { id: 'temple',    name: '🛕 Temple',        desc: '+10k cookies/sec',  baseCost: 1000000,   cps: 10000   },
  { id: 'lab',       name: '🔬 Laboratoire',   desc: '+50k cookies/sec',  baseCost: 6000000,   cps: 50000   },
  { id: 'spaceship', name: '🚀 Vaisseau',      desc: '+250k cookies/sec', baseCost: 35000000,  cps: 250000  },
  { id: 'dimension', name: '🌌 Dimension',     desc: '+1M cookies/sec',   baseCost: 200000000, cps: 1000000 },
  // ── Clic ──
  { id: 'click1',    name: '👆 Coup de pouce', desc: '+2 cookies/clic',   baseCost: 100,       cpc: 2      },
  { id: 'click2',    name: '💅 Doigt d\'or',   desc: '+10 cookies/clic',  baseCost: 600,       cpc: 10     },
  { id: 'click3',    name: '🧤 Gant magique',  desc: '+50 cookies/clic',  baseCost: 3500,      cpc: 50     },
  { id: 'click4',    name: '🔨 Marteau',       desc: '+200 cookies/clic', baseCost: 18000,     cpc: 200    },
  { id: 'click5',    name: '👊 Poing d\'acier',desc: '+1k cookies/clic',  baseCost: 100000,    cpc: 1000   },
  { id: 'click6',    name: '⚡ Laser',          desc: '+5k cookies/clic',  baseCost: 600000,    cpc: 5000   },
  { id: 'click7',    name: '☄️ Météorite',     desc: '+25k cookies/clic', baseCost: 4000000,   cpc: 25000  },
]

function getUpgradeCost(upgrade, owned) {
  return Math.floor(upgrade.baseCost * Math.pow(1.20, owned))
}

const GAMBLES = [
  { id: 'flip',   icon: '🪙', name: 'Pile ou Face', cost: 25,     chance: 0.40,   mult: 2,   desc: '40% de gagner ×2',      mental: 1  },
  { id: 'five',   icon: '🎯', name: '1 sur 5',       cost: 300,    chance: 0.16,   mult: 4,   desc: '16% de gagner ×4',      mental: 1  },
  { id: 'ten',    icon: '🏂', name: '1 sur 10',      cost: 1500,   chance: 0.08,   mult: 7,   desc: '8% de gagner ×7',       mental: 2  },
  { id: 'twenty', icon: '💥', name: '1 sur 20',      cost: 8000,   chance: 0.04,   mult: 14,  desc: '4% de gagner ×14',      mental: 2  },
  { id: 'hundo',  icon: '🎰', name: '1 sur 100',     cost: 25000,  chance: 0.008,  mult: 60,  desc: '0.8% de gagner ×60',    mental: 3  },
  { id: 'kilo',   icon: '👑', name: '1 sur 1000',    cost: 100000, chance: 0.0007, mult: 600, desc: '0.07% de gagner ×600',  mental: 5  },
]

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
  const [cpc, setCpc]                 = useState(1)
  const [clicking, setClicking]       = useState(false)
  const [loaded, setLoaded]           = useState(false)
  const [saving, setSaving]           = useState(false)
  const [floats, setFloats]           = useState([])
  const [tab, setTab]                 = useState('clicker')
  const [leaderboard, setLeaderboard] = useState([])
  const [lbLoading, setLbLoading]    = useState(false)
  const [customName, setCustomName]  = useState('')
  const [profileOpen, setProfileOpen]= useState(false)
  const [editingName, setEditingName]= useState('')
  const [savedEmail, setSavedEmail]  = useState('')
  const [loan, setLoan]               = useState(0)
  const [gambleResults, setGambleResults] = useState({})
  const [assets, setAssets]           = useState(getDefaultAssets)
  const [dead, setDead]               = useState(false)
  const [deathCause, setDeathCause]   = useState(null)
  const [mentalHealth, setMentalHealth] = useState(100)

  const cookiesRef      = useRef(0)
  const totalRef        = useRef(0)
  const ownedRef        = useRef({})
  const loanRef         = useRef(0)
  const assetsRef       = useRef(getDefaultAssets())
  const mentalRef       = useRef(100)
  const saveTimer       = useRef(null)

  const userId = user?.profile?.sub

  // Sync refs with state so the debounced save always has latest values
  useEffect(() => { cookiesRef.current = cookies }, [cookies])
  useEffect(() => { totalRef.current = totalCookies }, [totalCookies])
  useEffect(() => { ownedRef.current = owned }, [owned])
  useEffect(() => { loanRef.current = loan }, [loan])
  useEffect(() => { assetsRef.current = assets }, [assets])
  useEffect(() => { mentalRef.current = mentalHealth }, [mentalHealth])

  // Load save from Firebase
  useEffect(() => {
    if (!userId) return
    loadScore(userId)
      .then(data => {
        if (data) {
          setCookies(data.cookies ?? 0)
          setTotal(data.totalCookies ?? 0)
          setOwned(data.owned ?? {})
          setLoan(data.loan ?? 0)
          setAssets({ ...getDefaultAssets(), ...(data.assets ?? {}) })
          setMentalHealth(data.mentalHealth ?? 100)
          if (data.displayName) setCustomName(data.displayName)
          if (data.email) setSavedEmail(data.email)
        }
      })
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [userId])

  // Recalculate CPS + CPC whenever upgrades change
  useEffect(() => {
    const totalCps = UPGRADES.reduce((sum, u) => u.cps ? sum + (owned[u.id] || 0) * u.cps : sum, 0)
    const totalCpc = UPGRADES.reduce((sum, u) => u.cpc ? sum + (owned[u.id] || 0) * u.cpc : sum, 0)
    setCps(totalCps)
    setCpc(1 + totalCpc)
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

  // Loan interest: +2% every 20 seconds
  useEffect(() => {
    if (!loaded) return
    const interval = setInterval(() => {
      setLoan(l => {
        if (l <= 0) return l
        const newLoan = Math.ceil(l * 1.02)
        loanRef.current = newLoan
        return newLoan
      })
    }, 20000)
    return () => clearInterval(interval)
  }, [loaded])

  // Mental health passive regen: +1 every 60s
  useEffect(() => {
    if (!loaded) return
    const interval = setInterval(() => {
      setMentalHealth(mh => {
        const next = Math.min(100, mh + 1)
        mentalRef.current = next
        return next
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [loaded])

  const changeMentalHealth = (delta) => {
    setMentalHealth(mh => Math.max(0, Math.min(100, mh + delta)))
  }

  const scheduleSave = () => {
    if (!userId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await saveScore(userId, {
          displayName: customName || user?.profile?.preferred_username || user?.profile?.name || user?.profile?.email || 'Joueur',
          email: user?.profile?.email || savedEmail || '',
          cookies: cookiesRef.current,
          totalCookies: totalRef.current,
          owned: ownedRef.current,
          loan: loanRef.current,
          assets: assetsRef.current,
          mentalHealth: mentalRef.current,
          savedAt: new Date().toISOString(),
        })
      } catch (e) {
        console.error('Erreur de sauvegarde:', e)
      } finally {
        setSaving(false)
      }
    }, 4000)
  }

  // Fetch leaderboard when tab changes to 'leaderboard'
  useEffect(() => {
    if (tab !== 'leaderboard') return
    setLbLoading(true)
    getLeaderboard(50)
      .then(rows => setLeaderboard(rows))
      .catch(err => console.error('Leaderboard error:', err))
      .finally(() => setLbLoading(false))
  }, [tab])

  const handleClick = (e) => {
    setCookies(c => c + cpc)
    setTotal(t => t + cpc)
    setClicking(true)
    setTimeout(() => setClicking(false), 100)

    // Floating animation
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now() + Math.random()
    setFloats(f => [...f, { id, x, y, value: cpc }])
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

  const handleCasinoResult = (delta) => {
    setCookies(c => c + delta)
    scheduleSave()
  }

  const handleMentalChange = (delta) => {
    changeMentalHealth(delta)
  }

  const handleBorrow = (amount, totalOwed) => {
    setCookies(c => c + amount)
    setLoan(l => l + totalOwed)
    scheduleSave()
  }

  const handleRepay = (amount) => {
    const repay = Math.min(amount, loan)
    setCookies(c => c - repay)
    setLoan(l => Math.max(0, l - repay))
    scheduleSave()
  }

  const handleSellAsset = (asset) => {
    const qty = assets[asset.id] ?? asset.startQty
    if (qty <= 0) return
    const newQty = qty - 1
    setAssets(a => ({ ...a, [asset.id]: newQty }))
    setCookies(c => c + asset.price)
    changeMentalHealth(asset.mentalImpact ?? -3)
    scheduleSave()
    if (asset.fatalAtZero && newQty === 0) {
      setTimeout(() => handleDeath(asset), 600)
    }
  }

  const handleDeath = (cause) => {
    setDeathCause(cause)
    setCookies(0)
    setTotal(0)
    setOwned({})
    setLoan(0)
    setAssets(getDefaultAssets())
    setMentalHealth(100)
    setDead(true)
    if (userId) {
      saveScore(userId, {
        cookies: 0, totalCookies: 0, owned: {}, loan: 0,
        assets: getDefaultAssets(), mentalHealth: 100,
        savedAt: new Date().toISOString(),
      }).catch(console.error)
    }
  }

  const handleRespawn = () => {
    setDead(false)
    setDeathCause(null)
  }

  const handleBuyItem = (item) => {
    if (cookies < item.cost) return
    setCookies(c => c - item.cost)
    if (item.consumable) {
      changeMentalHealth(item.mentalBoost ?? 0)
    } else {
      setAssets(a => ({ ...a, [item.id]: (a[item.id] ?? 0) + 1 }))
      changeMentalHealth(item.mentalBoost ?? 3)
    }
    scheduleSave()
  }

  const handleGamble = (gamble) => {
    if (cookies < gamble.cost) return
    const win = Math.random() < gamble.chance
    if (win) {
      const gain = Math.floor(gamble.cost * gamble.mult)
      setCookies(c => c - gamble.cost + gain)
      changeMentalHealth(gamble.mental ?? 5)
    } else {
      setCookies(c => c - gamble.cost)
      changeMentalHealth(-(gamble.mental ?? 5))
    }
    setGambleResults(r => ({ ...r, [gamble.id]: win ? 'win' : 'lose' }))
    setTimeout(() => setGambleResults(r => { const n = { ...r }; delete n[gamble.id]; return n }), 1600)
    scheduleSave()
  }

  // Mental health = 0 → death
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!loaded || dead || mentalHealth > 0) return
    const timer = setTimeout(() =>
      handleDeath({ name: 'dépression totale', type: 'mental' })
    , 400)
    return () => clearTimeout(timer)
  }, [mentalHealth, loaded, dead])

  if (!loaded) {
    return (
      <div className="centered">
        <div className="spinner" />
        <p>Chargement de la partie...</p>
      </div>
    )
  }

  const picture = user?.profile?.picture
  const name    = customName || user?.profile?.name || user?.profile?.email || 'Joueur'
  const email   = user?.profile?.email || savedEmail || ''

  const handleSaveName = () => {
    const trimmed = editingName.trim()
    if (!trimmed) return
    setCustomName(trimmed)
    setProfileOpen(false)
    if (userId) {
      saveScore(userId, { displayName: trimmed }).catch(console.error)
    }
  }

  return (
    <div className="game">

      {/* Death overlay */}
      {dead && (
        <div className="death-screen">
          <div className="death-box">
            <div className="death-skull">💀</div>
            <h2 className="death-title">Vous êtes mort</h2>
            <p className="death-msg">
              {deathCause?.type === 'mental'
                ? <>Votre santé mentale a atteint 0.<br />Vous avez sombré dans la dépression…</>
                : deathCause?.type === 'roulette'
                ? <>La balle était dans la chambre.<br />Vous n&apos;avez pas eu de chance…</>
                : <>Vous avez vendu votre <strong>{deathCause?.name}</strong>…</>}
              <br />Tout est perdu. Cookies, upgrades, emprunt — tout.
            </p>
            <button className="btn-respawn" onClick={handleRespawn}>
              Recommencer à zéro
            </button>
          </div>
        </div>
      )}

      {/* Profile modal */}
      {profileOpen && (
        <div className="profile-overlay" onClick={() => setProfileOpen(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <h2 className="profile-title">👤 Mon profil</h2>
            {picture && <img src={picture} alt="avatar" className="profile-avatar" referrerPolicy="no-referrer" />}
            <label className="profile-label">Nom d&apos;affichage</label>
            <input
              className="profile-input"
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              placeholder={name}
              maxLength={32}
              autoFocus
            />
            <label className="profile-label">Email</label>
            <div className="profile-email">{email}</div>
            <div className="profile-actions">
              <button className="btn-profile-save" onClick={handleSaveName}>Sauvegarder</button>
              <button className="btn-profile-cancel" onClick={() => setProfileOpen(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="game-header">
        <div className="user-info" onClick={() => { setEditingName(name); setProfileOpen(true) }} style={{cursor:'pointer'}} title="Modifier le profil">
          {picture && <img src={picture} alt="avatar" className="avatar" referrerPolicy="no-referrer" />}
          <span className="user-name">{name}</span>
          {saving && <span className="saving-badge">💾 Sauvegarde…</span>}
        </div>
        <button className="btn-logout" onClick={onLogout}>Déconnexion</button>
      </header>

      {/* Top tabs */}
      <nav className="game-tabs">
        <button className={`game-tab ${tab === 'clicker' ? 'active' : ''}`} onClick={() => setTab('clicker')}>
          🍪 Clicker
        </button>
        <button className={`game-tab ${tab === 'casino' ? 'active' : ''}`} onClick={() => setTab('casino')}>
          🎰 Casino
        </button>
        <button className={`game-tab ${tab === 'bank' ? 'active' : ''}`} onClick={() => setTab('bank')}>
          🏦 Banque{loan > 0 ? <span className="tab-debt-badge"> !</span> : null}
        </button>
        <button className={`game-tab ${tab === 'life' ? 'active' : ''}`} onClick={() => setTab('life')}>
          💼 Vie
        </button>
        <button className={`game-tab ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')}>
          🏆 Classement
        </button>
      </nav>

      {/* Mental health bar */}
      <div className="mental-bar-container">
        <span className="mental-label">
          {mentalHealth >= 70 ? '😊' : mentalHealth >= 40 ? '😐' : '😰'} Santé mentale
        </span>
        <div className="mental-bar-track">
          <div
            className={`mental-bar-fill ${mentalHealth >= 70 ? 'mental-good' : mentalHealth >= 40 ? 'mental-mid' : 'mental-bad'}`}
            style={{ width: `${mentalHealth}%` }}
          />
        </div>
        <span className="mental-pct">{Math.round(mentalHealth)}%</span>
      </div>

      <main className="game-main">
        {tab === 'clicker' ? (
          /* Cookie zone */
          <section className="cookie-zone">
          <div className="stats">
            <div className="stat">
              <span className={`stat-value ${cookies < 0 ? 'stat-debt' : ''}`}>{cookies < 0 ? '−' : ''}{fmt(Math.abs(cookies))}</span>
              <span className="stat-label">{cookies < 0 ? '🔴 dette' : 'cookies'}</span>
            </div>
            {cps > 0 && (
              <div className="stat">
                <span className="stat-value">{fmt(cps)}</span>
                <span className="stat-label">par seconde</span>
              </div>
            )}
            {cpc > 1 && (
              <div className="stat">
                <span className="stat-value">{fmt(cpc)}</span>
                <span className="stat-label">par clic</span>
              </div>
            )}
            {loan > 0 && (
              <div className="stat">
                <span className="stat-value stat-debt">{fmt(loan)}</span>
                <span className="stat-label">💸 emprunt</span>
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
                +{fmt(f.value)}
              </span>
            ))}
          </div>

          <p className="total-label">Total cuit : {fmt(totalCookies)} cookies</p>
        </section>
        ) : tab === 'casino' ? (
          <Casino cookies={cookies} onResult={handleCasinoResult} onMentalChange={handleMentalChange} onDeath={handleDeath} />
        ) : tab === 'life' ? (
          <Life
            cookies={cookies}
            assets={assets}
            onSell={handleSellAsset}
            onBuy={handleBuyItem}
          />
        ) : tab === 'leaderboard' ? (
          <section className="leaderboard">
            <h2 className="lb-title">🏆 Classement</h2>
            {lbLoading ? (
              <p className="lb-loading">Chargement…</p>
            ) : leaderboard.length === 0 ? (
              <p className="lb-loading">Aucun joueur trouvé.</p>
            ) : (
              <ol className="lb-list">
                {leaderboard.map((row, i) => {
                  const isMe = row.id === userId
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
                  return (
                    <li key={row.id} className={`lb-row ${isMe ? 'lb-me' : ''}`}>
                      <span className="lb-rank">{medal}</span>
                      <span className="lb-name">{row.displayName || 'Joueur'}</span>
                      <span className="lb-score">{fmt(row.cookies ?? 0)} 🍪</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        ) : (
          <Bank cookies={cookies} loan={loan} onBorrow={handleBorrow} onRepay={handleRepay} />
        )}

        {/* Upgrades panel */}
        <aside className="upgrades">
          <h2 className="upgrades-title">Améliorations</h2>

          <div className="upgrades-section-label">⏱️ Passif</div>
          {UPGRADES.filter(u => u.cps).map(upgrade => {
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

          <div className="upgrades-divider" />
          <div className="upgrades-section-label">👆 Clic</div>
          {UPGRADES.filter(u => u.cpc).map(upgrade => {
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

          <div className="upgrades-divider" />
          <h2 className="upgrades-title">Paris rapides</h2>
          {GAMBLES.map(gamble => {
            const canAfford = cookies >= gamble.cost
            const result    = gambleResults[gamble.id]
            return (
              <button
                key={gamble.id}
                className={`gamble-item ${
                  result === 'win' ? 'gamble-win'
                  : result === 'lose' ? 'gamble-lose'
                  : canAfford ? 'gamble-ready' : 'gamble-broke'
                }`}
                onClick={() => handleGamble(gamble)}
                disabled={!canAfford}
              >
                <span className="upgrade-icon">{gamble.icon}</span>
                <div className="upgrade-info">
                  <span className="upgrade-name">{gamble.name}</span>
                  <span className="upgrade-desc">{gamble.desc}</span>
                </div>
                <div className="upgrade-meta">
                  {result === 'win'
                    ? <span className="gamble-result-win">+{fmt(Math.floor(gamble.cost * (gamble.mult - 1)))} 🍪</span>
                    : result === 'lose'
                    ? <span className="gamble-result-lose">−{fmt(gamble.cost)} 🍪</span>
                    : <span className="upgrade-cost">{fmt(gamble.cost)} 🍪</span>
                  }
                </div>
              </button>
            )
          })}
        </aside>
      </main>
    </div>
  )
}
