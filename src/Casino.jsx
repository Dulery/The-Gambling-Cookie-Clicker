import { useState, useRef, useEffect } from 'react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}

// ── Slot Machine ──────────────────────────────────────────────────────────────

const SYMBOLS = [
  { sym: '🍪', weight: 6 },
  { sym: '🍋', weight: 5 },
  { sym: '🔔', weight: 4 },
  { sym: '🎲', weight: 3 },
  { sym: '💎', weight: 2 },
  { sym: '👑', weight: 1 },
]

const TOTAL_WEIGHT = SYMBOLS.reduce((s, x) => s + x.weight, 0)

function spinReel() {
  let r = Math.random() * TOTAL_WEIGHT
  for (const s of SYMBOLS) { r -= s.weight; if (r <= 0) return s.sym }
  return SYMBOLS[0].sym
}

function getMultiplier(reels) {
  const [a, b, c] = reels
  if (a === b && b === c) {
    if (a === '👑') return 25
    if (a === '💎') return 12
    if (a === '🎲') return 6
    if (a === '🔔') return 4
    if (a === '🍋') return 3
    return 2.5
  }
  if (a === b || b === c || a === c) return 1.5
  return 0
}

function SlotMachine({ cookies, onResult, onMentalChange }) {
  const [reels, setReels]     = useState(['🍪', '🍪', '🍪'])
  const [spinning, setSpinning] = useState(false)
  const [bet, setBet]         = useState(50)
  const [msg, setMsg]         = useState(null)
  const animRef               = useRef(null)

  const maxBet = Math.max(1, Math.min(cookies, 999999))

  const spin = () => {
    if (spinning || bet < 1 || bet > cookies) return
    onResult(-bet)
    setSpinning(true)
    setMsg(null)
    const final = [spinReel(), spinReel(), spinReel()]
    let tick = 0
    const TICKS = 22
    animRef.current = setInterval(() => {
      tick++
      setReels([
        tick > TICKS * 0.55 ? final[0] : spinReel(),
        tick > TICKS * 0.75 ? final[1] : spinReel(),
        tick >= TICKS        ? final[2] : spinReel(),
      ])
      if (tick >= TICKS) {
        clearInterval(animRef.current)
        setReels(final)
        setSpinning(false)
        const mult = getMultiplier(final)
        if (mult > 0) {
          const gain = Math.floor(bet * mult)
          onResult(gain)
          onMentalChange(5)
          setMsg({ text: `+${fmt(gain)} 🍪  (×${mult})`, win: true })
        } else {
          onMentalChange(-5)
          setMsg({ text: `Perdu ! -${fmt(bet)} 🍪`, win: false })
        }
      }
    }, 65)
  }

  return (
    <div className="slot-machine">
      <h3>🎰 Machine à Sous</h3>

      <div className="slot-reels">
        {reels.map((sym, i) => (
          <div key={i} className={`slot-reel ${spinning ? 'spinning' : ''}`}>{sym}</div>
        ))}
      </div>

      {msg && <div className={`slot-msg ${msg.win ? 'slot-win' : 'slot-lose'}`}>{msg.text}</div>}

      <div className="bet-row">
        <span>Mise</span>
        <input
          type="number" className="bet-input"
          value={bet} min={1} max={maxBet}
          onChange={e => setBet(Math.max(1, Math.min(maxBet, +e.target.value)))}
        />
        <button className="btn-bet" onClick={() => setBet(b => Math.max(1, Math.floor(b / 2)))}>½</button>
        <button className="btn-bet accent" onClick={() => setBet(b => Math.min(maxBet, b * 2))}>×2</button>
        <button className="btn-bet red" onClick={() => setBet(maxBet)}>MAX</button>
      </div>

      <div className="slot-payouts">
        <span>👑×3 = ×25</span><span>💎×3 = ×12</span>
        <span>🎲×3 = ×6</span><span>🔔×3 = ×4</span>
        <span>🍋×3 = ×3</span><span>🍪×3 = ×2.5</span>
        <span style={{ gridColumn: '1/-1' }}>Paire = ×1.5</span>
      </div>

      <button
        className="btn-spin"
        onClick={spin}
        disabled={spinning || bet > cookies || bet < 1}
      >
        {spinning ? '🎰 En cours…' : `🎰 Lancer (${fmt(bet)} 🍪)`}
      </button>
    </div>
  )
}

// ── Blackjack ─────────────────────────────────────────────────────────────────

const SUITS = [
  { name: 'heart',   folder: 'Heart'   },
  { name: 'diamond', folder: 'Diamond' },
  { name: 'clover',  folder: 'Clover'  },
  { name: 'spade',   folder: 'Spade'   },
]

function buildDeck() {
  const d = []
  for (const suit of SUITS)
    for (let v = 1; v <= 13; v++)
      d.push({ suit: suit.name, folder: suit.folder, value: v })
  return d
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function cardImg(card) {
  return `/cards/${card.folder}/card_${card.value}_${card.suit}.png`
}

function bjVal(card) {
  if (card.value === 1) return 11
  return Math.min(card.value, 10)
}

function total(hand) {
  let t = hand.reduce((s, c) => s + bjVal(c), 0)
  let aces = hand.filter(c => c.value === 1).length
  while (t > 21 && aces-- > 0) t -= 10
  return t
}

const FACE = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }
function cardLabel(card) { return FACE[card.value] ?? card.value }

function Hand({ cards, hideSecond = false }) {
  return (
    <div className="bj-hand">
      {cards.map((c, i) =>
        hideSecond && i === 1
          ? <div key={i} className="card card-back" />
          : <img key={i} src={cardImg(c)} className="card" alt={`${cardLabel(c)} ${c.suit}`} />
      )}
    </div>
  )
}

function Blackjack({ cookies, onResult, onMentalChange }) {
  const [deck,    setDeck]    = useState([])
  const [player,  setPlayer]  = useState([])
  const [dealer,  setDealer]  = useState([])
  const [bet,     setBet]     = useState(50)
  const [phase,   setPhase]   = useState('idle')   // idle | playing | reveal | done
  const [outcome, setOutcome] = useState(null)      // bj | win | lose | push
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const maxBet = Math.max(1, Math.min(cookies, 999999))

  const deal = () => {
    if (bet < 1 || bet > cookies) return
    onResult(-bet)
    const d = shuffle([...buildDeck(), ...buildDeck()])
    const p = [d[0], d[2]]
    const dl = [d[1], d[3]]
    setDeck(d.slice(4))
    setPlayer(p)
    setDealer(dl)
    setOutcome(null)
    if (total(p) === 21) {
      setPhase('done')
      const gain = Math.floor(bet * 2.5)
      onResult(gain)
      onMentalChange(12)
      setOutcome('bj')
    } else {
      setPhase('playing')
    }
  }

  const hit = () => {
    if (phase !== 'playing') return
    setDeck(dk => {
      const card = dk[0]
      const newPlayer = [...player, card]
      setPlayer(newPlayer)
      if (total(newPlayer) > 21) { setPhase('done'); setOutcome('lose') }
      return dk.slice(1)
    })
  }

  const stand = (currentPlayer = player) => {
    setPhase('reveal')
    let d  = [...dealer]
    let dk = [...deck]

    const runDealer = async () => {
      while (total(d) < 17) {
        await new Promise(r => setTimeout(r, 700))
        if (!mountedRef.current) return
        d = [...d, dk[0]]
        dk = dk.slice(1)
        setDealer([...d])
      }
      if (!mountedRef.current) return
      setDeck(dk)
      setPhase('done')
      const pv = total(currentPlayer)
      const dv = total(d)
      if (dv > 21 || pv > dv)  { onResult(bet * 2); onMentalChange(8);  setOutcome('win')  }
      else if (pv === dv)       { onResult(bet);     onMentalChange(3);  setOutcome('push') }
      else                      { onMentalChange(-8);                    setOutcome('lose') }
    }
    runDealer()
  }

  const doubleDown = () => {
    if (phase !== 'playing' || player.length !== 2) return
    const extra = Math.min(bet, cookies)
    onResult(-extra)
    const card = deck[0]
    const newPlayer = [...player, card]
    setDeck(dk => dk.slice(1))
    setPlayer(newPlayer)
    if (total(newPlayer) > 21) { setPhase('done'); setOutcome('lose') }
    else stand(newPlayer)
  }

  const reset = () => { setPhase('idle'); setOutcome(null); setPlayer([]); setDealer([]) }

  const OUTCOME_LABEL = {
    bj:   '🎉 Blackjack ! ×2.5',
    win:  '✅ Gagné ! ×2',
    lose: '❌ Perdu',
    push: '🤝 Égalité — remboursé',
  }

  return (
    <div className="blackjack">
      <h3>🃏 Blackjack</h3>

      {phase !== 'idle' && (
        <div className="bj-table">
          <div className="bj-side">
            <div className="bj-label">
              Croupier{phase !== 'playing' ? ` — ${total(dealer)}` : ''}
            </div>
            <Hand cards={dealer} hideSecond={phase === 'playing'} />
          </div>
          <div className="bj-divider" />
          <div className="bj-side">
            <div className="bj-label">Toi — {total(player)}</div>
            <Hand cards={player} />
          </div>
        </div>
      )}

      {outcome && (
        <div className={`bj-outcome bj-${outcome === 'lose' ? 'lose' : outcome === 'push' ? 'push' : 'win'}`}>
          {OUTCOME_LABEL[outcome]}
        </div>
      )}

      {phase === 'idle' && (
        <>
          <div className="bet-row">
            <span>Mise</span>
            <input
              type="number" className="bet-input"
              value={bet} min={1} max={maxBet}
              onChange={e => setBet(Math.max(1, Math.min(maxBet, +e.target.value)))}
            />
            <button className="btn-bet" onClick={() => setBet(b => Math.max(1, Math.floor(b / 2)))}>½</button>
            <button className="btn-bet accent" onClick={() => setBet(b => Math.min(maxBet, b * 2))}>×2</button>
            <button className="btn-bet red" onClick={() => setBet(maxBet)}>MAX</button>
          </div>
          <button className="btn-deal" onClick={deal} disabled={bet > cookies || bet < 1}>
            🃏 Distribuer ({fmt(bet)} 🍪)
          </button>
          <div className="bj-rules">
            Blackjack paie ×2.5 · Victoire ×2 · Double disponible en 2 cartes
          </div>
        </>
      )}

      {phase === 'playing' && (
        <div className="bj-actions">
          <button className="btn-hit"    onClick={hit}>Tirer</button>
          <button className="btn-stand"  onClick={() => stand()}>Rester</button>
          {player.length === 2 && bet <= cookies && (
            <button className="btn-double" onClick={doubleDown}>Double ({fmt(Math.min(bet, cookies))} 🍪)</button>
          )}
        </div>
      )}

      {phase === 'reveal' && (
        <div className="bj-dealing">Le croupier distribue…</div>
      )}

      {phase === 'done' && (
        <button className="btn-deal" onClick={reset}>Nouvelle partie</button>
      )}
    </div>
  )
}

// ── Wheel of Fortune ─────────────────────────────────────────────────────────

// Alternating win/loss — each pair shares the same weight → exactly 50/50
// win: true  → return bet × mult (net gain = bet × (mult-1))
// win: false → lose bet × mult total (after bet already deducted, adjust by bet×(1-mult))
const WHEEL_SEGS = [
  { icon: '🍋', label: '×1.5',  win: true,  mult: 1.5, color: '#a16207', textColor: '#fff', weight: 6 },
  { icon: '😅', label: '-½×',   win: false, mult: 0.5, color: '#92400e', textColor: '#fed7aa', weight: 6 },
  { icon: '🍪', label: '×2',    win: true,  mult: 2,   color: '#15803d', textColor: '#fff', weight: 5 },
  { icon: '💸', label: '-1×',   win: false, mult: 1,   color: '#991b1b', textColor: '#fff', weight: 5 },
  { icon: '🔔', label: '×3',    win: true,  mult: 3,   color: '#c2410c', textColor: '#fff', weight: 4 },
  { icon: '😬', label: '-1.5×', win: false, mult: 1.5, color: '#7f1d1d', textColor: '#fca5a5', weight: 4 },
  { icon: '💎', label: '×5',    win: true,  mult: 5,   color: '#1d4ed8', textColor: '#fff', weight: 3 },
  { icon: '💀', label: '-2×',   win: false, mult: 2,   color: '#450a0a', textColor: '#ef4444', weight: 3 },
  { icon: '⭐', label: '×10',   win: true,  mult: 10,  color: '#6d28d9', textColor: '#fff', weight: 2 },
  { icon: '☠️', label: '-3×',   win: false, mult: 3,   color: '#1c0000', textColor: '#f87171', weight: 2 },
  { icon: '👑', label: '×25',   win: true,  mult: 25,  color: '#d97706', textColor: '#000', weight: 1 },
  { icon: '🔥', label: '-5×',   win: false, mult: 5,   color: '#0d0000', textColor: '#fca5a5', weight: 1 },
]

const W_N   = WHEEL_SEGS.length     // 12 segments
const W_ANG = 360 / W_N             // 30° each
const W_CX  = 150, W_CY = 150
const W_R   = 138, W_RL = 96        // outer radius, label radius

function wPolar(r, deg) {
  const rad = (deg - 90) * (Math.PI / 180)
  return [W_CX + r * Math.cos(rad), W_CY + r * Math.sin(rad)]
}

function wSlice(startDeg, endDeg) {
  const [x1, y1] = wPolar(W_R, startDeg)
  const [x2, y2] = wPolar(W_R, endDeg)
  return `M ${W_CX} ${W_CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${W_R} ${W_R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

function Wheel({ cookies, onResult, onMentalChange }) {
  const [rotation, setRotation] = useState(0)
  const [pending,  setPending]  = useState(null)   // target rotation, applied after transition is enabled
  const [spinning, setSpinning] = useState(false)
  const [bet,      setBet]      = useState(50)
  const [result,   setResult]   = useState(null)
  const timerRef                = useRef(null)

  const maxBet = Math.max(1, Math.min(cookies, 999999))

  // Two-step: set spinning (enables CSS transition), then apply rotation (triggers animation)
  useEffect(() => {
    if (spinning && pending !== null) {
      setRotation(pending)
      setPending(null)
    }
  }, [spinning, pending])

  const spin = () => {
    if (spinning || bet < 1 || bet > cookies) return
    setResult(null)

    // Weighted random pick
    const totalW = WHEEL_SEGS.reduce((s, x) => s + x.weight, 0)
    let r = Math.random() * totalW
    let winIdx = WHEEL_SEGS.length - 1
    for (let i = 0; i < WHEEL_SEGS.length; i++) {
      r -= WHEEL_SEGS[i].weight
      if (r <= 0) { winIdx = i; break }
    }

    // Pointer is at top. When wheel rotates clockwise by R:
    //   position (360 - R%360) on the wheel faces the pointer.
    // To show segment winIdx (center at (winIdx+0.5)*W_ANG), we need:
    //   R % 360 = (360 - (winIdx + 0.5) * W_ANG + 360) % 360
    const curMod    = ((rotation % 360) + 360) % 360
    const targetMod = (360 - (winIdx + 0.5) * W_ANG + 360) % 360
    let diff        = targetMod - curMod
    if (diff <= 0) diff += 360
    const newRot = rotation + 5 * 360 + diff

    onResult(-bet)
    setSpinning(true)       // step 1: enable transition
    setPending(newRot)      // step 2: useEffect applies rotation → animation fires

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const seg = WHEEL_SEGS[winIdx]
      if (seg.win) {
        // Return winnings (bet already deducted)
        onResult(Math.floor(bet * seg.mult))
        onMentalChange(5)
      } else {
        // Total loss = bet × mult. Already deducted bet, so adjust the remainder:
        // mult < 1 → partial refund; mult > 1 → extra loss
        const adjust = Math.floor(bet * (1 - seg.mult))
        if (adjust !== 0) onResult(adjust)
        onMentalChange(-5)
      }
      setResult({ ...seg, betAmount: bet })
      setSpinning(false)
    }, 4500)
  }

  const wheelStyle = {
    transform:  `rotate(${rotation}deg)`,
    transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
  }

  return (
    <div className="wheel-container">
      <h3>🎡 Roue de la Fortune</h3>

      <div className="wheel-wrapper">
        <div className="wheel-pointer" />
        <div style={wheelStyle}>
          <svg viewBox="0 0 300 300" width="280" height="280">
            {/* Segments */}
            {WHEEL_SEGS.map((seg, i) => (
              <path key={i} d={wSlice(i * W_ANG, (i + 1) * W_ANG)}
                fill={seg.color} stroke="#f5a623" strokeWidth="1.5" />
            ))}
            {/* Outer gold ring */}
            <circle cx={W_CX} cy={W_CY} r={W_R} fill="none" stroke="#f5a623" strokeWidth="3" />
            {/* Text labels — each group rotated to its segment's midpoint */}
            {WHEEL_SEGS.map((seg, i) => {
              const midDeg = (i + 0.5) * W_ANG
              const flip   = midDeg > 90 && midDeg < 270 ? 180 : 0
              return (
                <g key={i} transform={`rotate(${midDeg}, ${W_CX}, ${W_CY})`}>
                  <text x={W_CX} y={W_CY - W_RL}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={seg.textColor} fontSize="13"
                    transform={`rotate(${flip}, ${W_CX}, ${W_CY - W_RL})`}
                    style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {seg.icon}
                  </text>
                  <text x={W_CX} y={W_CY - W_RL + 17}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={seg.textColor} fontSize="8" fontWeight="bold"
                    transform={`rotate(${flip}, ${W_CX}, ${W_CY - W_RL + 17})`}
                    style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {seg.label}
                  </text>
                </g>
              )
            })}
            {/* Center hub */}
            <circle cx={W_CX} cy={W_CY} r="20" fill="#0d1117" stroke="#f5a623" strokeWidth="3" />
            <text x={W_CX} y={W_CY + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize="16" style={{ userSelect: 'none', pointerEvents: 'none' }}>🍪</text>
          </svg>
        </div>
      </div>

      {result && (
        <div className={`slot-msg ${result.win ? 'slot-win' : 'slot-lose'}`}>
          {result.win
            ? `${result.icon} +${fmt(Math.floor(result.betAmount * result.mult))} 🍪  (×${result.mult})`
            : `${result.icon} -${fmt(Math.floor(result.betAmount * result.mult))} 🍪  (-×${result.mult})`}
        </div>
      )}

      <div className="bet-row">
        <span>Mise</span>
        <input type="number" className="bet-input" value={bet} min={1} max={maxBet}
          onChange={e => setBet(Math.max(1, Math.min(maxBet, +e.target.value)))} />
        <button className="btn-bet" onClick={() => setBet(b => Math.max(1, Math.floor(b / 2)))}>½</button>
        <button className="btn-bet accent" onClick={() => setBet(b => Math.min(maxBet, b * 2))}>×2</button>
        <button className="btn-bet red" onClick={() => setBet(maxBet)}>MAX</button>
      </div>

      <button className="btn-spin" onClick={spin} disabled={spinning || bet > cookies || bet < 1}>
        {spinning ? '🎡 En cours…' : `🎡 Tourner (${fmt(bet)} 🍪)`}
      </button>
    </div>
  )
}

// ── Casino wrapper ────────────────────────────────────────────────────────────

export default function Casino({ cookies, onResult, onMentalChange }) {
  const [tab, setTab] = useState('slots')

  return (
    <div className="casino">
      <div className="casino-tabs">
        <button className={`casino-tab ${tab === 'slots'     ? 'active' : ''}`} onClick={() => setTab('slots')}>🎰 Slots</button>
        <button className={`casino-tab ${tab === 'wheel'     ? 'active' : ''}`} onClick={() => setTab('wheel')}>🎡 Roue</button>
        <button className={`casino-tab ${tab === 'blackjack' ? 'active' : ''}`} onClick={() => setTab('blackjack')}>🃏 Blackjack</button>
      </div>

      {tab === 'slots'     && <SlotMachine cookies={cookies} onResult={onResult} onMentalChange={onMentalChange} />}
      {tab === 'wheel'     && <Wheel       cookies={cookies} onResult={onResult} onMentalChange={onMentalChange} />}
      {tab === 'blackjack' && <Blackjack   cookies={cookies} onResult={onResult} onMentalChange={onMentalChange} />}
    </div>
  )
}
