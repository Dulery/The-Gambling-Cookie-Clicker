import { useState, useRef, useEffect } from 'react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}

// ── Slot Machine ──────────────────────────────────────────────────────────────

const SYMBOLS = [
  { sym: '🍪', weight: 8 },
  { sym: '🍋', weight: 7 },
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
    if (a === '👑') return 18
    if (a === '💎') return 8
    if (a === '🎲') return 5
    if (a === '🔔') return 3
    if (a === '🍋') return 2
    return 1.5
  }
  return 0
}

function SlotMachine({ cookies, onResult, onMentalChange }) {
  const [reels, setReels]     = useState(['🍪', '🍪', '🍪'])
  const [spinning, setSpinning] = useState(false)
  const [bet, setBet]         = useState(50)
  const [msg, setMsg]         = useState(null)
  const animRef               = useRef(null)

  const maxBet = Math.max(1, cookies)

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
          onMentalChange(2)
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
        <span>👑×3 = ×18</span><span>💎×3 = ×8</span>
        <span>🎲×3 = ×5</span><span>🔔×3 = ×3</span>
        <span>🍋×3 = ×2</span><span>🍪×3 = ×1.5</span>
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
  return `/${card.folder}/card_${card.value}_${card.suit}.png`
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

  const maxBet = Math.max(1, cookies)

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
      const gain = Math.floor(bet * 2.2)
      onResult(gain)
      onMentalChange(4)
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
      if (dv > 21 || pv > dv)  { onResult(bet * 2); onMentalChange(3);  setOutcome('win')  }
      else if (pv === dv)       { onResult(bet);     onMentalChange(1);  setOutcome('push') }
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
    bj:   '🎉 Blackjack ! ×2.2',
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
            Blackjack paie ×2.2 · Victoire ×2 · Double disponible en 2 cartes
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
  { icon: '🍋', label: '×1.2',  win: true,  mult: 1.2, color: '#a16207', textColor: '#fff', weight: 7 },
  { icon: '😅', label: '-½×',   win: false, mult: 0.5, color: '#92400e', textColor: '#fed7aa', weight: 7 },
  { icon: '🍪', label: '×1.7',  win: true,  mult: 1.7, color: '#15803d', textColor: '#fff', weight: 6 },
  { icon: '💸', label: '-1×',   win: false, mult: 1,   color: '#991b1b', textColor: '#fff', weight: 6 },
  { icon: '🔔', label: '×2.5',  win: true,  mult: 2.5, color: '#c2410c', textColor: '#fff', weight: 3 },
  { icon: '😬', label: '-1.5×', win: false, mult: 1.5, color: '#7f1d1d', textColor: '#fca5a5', weight: 5 },
  { icon: '💎', label: '×4',    win: true,  mult: 4,   color: '#1d4ed8', textColor: '#fff', weight: 2 },
  { icon: '💀', label: '-2×',   win: false, mult: 2,   color: '#450a0a', textColor: '#ef4444', weight: 4 },
  { icon: '⭐', label: '×8',    win: true,  mult: 8,   color: '#6d28d9', textColor: '#fff', weight: 1 },
  { icon: '☠️', label: '-3×',   win: false, mult: 3,   color: '#1c0000', textColor: '#f87171', weight: 3 },
  { icon: '👑', label: '×18',   win: true,  mult: 18,  color: '#d97706', textColor: '#000', weight: 1 },
  { icon: '🔥', label: '-5×',   win: false, mult: 5,   color: '#0d0000', textColor: '#fca5a5', weight: 2 },
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

  const maxBet = Math.max(1, cookies)

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
        onMentalChange(2)
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

// ── Poker (5-Card Draw) ───────────────────────────────────────────────────────

const POKER_COMBOS = [
  { name: 'Quinte Flush Royale', short: 'A-K-Q-J-10 même couleur',     mult: 250, icon: '👑🔥' },
  { name: 'Quinte Flush',        short: '5 consécutives même couleur',  mult: 50,  icon: '✨'   },
  { name: 'Carré',               short: '4 cartes identiques',          mult: 25,  icon: '4️⃣'  },
  { name: 'Full House',          short: 'Brelan + Paire',               mult: 9,   icon: '🏠'   },
  { name: 'Couleur (Flush)',      short: '5 de même couleur',            mult: 6,   icon: '♠️'   },
  { name: 'Suite (Straight)',     short: '5 cartes consécutives',        mult: 4,   icon: '📈'   },
  { name: 'Brelan',              short: '3 cartes identiques',           mult: 3,   icon: '3️⃣'  },
  { name: 'Double Paire',        short: '2 paires différentes',          mult: 2,   icon: '2️⃣2️⃣' },
  { name: 'Paire (Valet ou +)',  short: 'Paire de J, Q, K ou A',        mult: 1,   icon: '↩️'   },
]

function evaluatePokerHand(hand) {
  const vals  = hand.map(c => c.value).sort((a, b) => a - b)
  const suits = hand.map(c => c.suit)

  const counts = {}
  vals.forEach(v => { counts[v] = (counts[v] || 0) + 1 })
  const groups = Object.values(counts).sort((a, b) => b - a)

  const isFlush = suits.every(s => s === suits[0])

  const uniq = [...new Set(vals)].sort((a, b) => a - b)
  const isRoyalStraight = uniq.length === 5 &&
    JSON.stringify(uniq) === JSON.stringify([1, 10, 11, 12, 13])
  const isStraight = uniq.length === 5 &&
    (uniq[4] - uniq[0] === 4 || isRoyalStraight)

  if (isFlush && isRoyalStraight)        return { name: 'Quinte Flush Royale', mult: 250, rank: 9 }
  if (isFlush && isStraight)             return { name: 'Quinte Flush',        mult: 50,  rank: 8 }
  if (groups[0] === 4)                   return { name: 'Carré',               mult: 25,  rank: 7 }
  if (groups[0] === 3 && groups[1] === 2) return { name: 'Full House',          mult: 9,   rank: 6 }
  if (isFlush)                           return { name: 'Couleur (Flush)',      mult: 6,   rank: 5 }
  if (isStraight)                        return { name: 'Suite (Straight)',     mult: 4,   rank: 4 }
  if (groups[0] === 3)                   return { name: 'Brelan',               mult: 3,   rank: 3 }
  if (groups[0] === 2 && groups[1] === 2) return { name: 'Double Paire',        mult: 2,   rank: 2 }
  if (groups[0] === 2) {
    const pairVal = parseInt(Object.entries(counts).find(([, c]) => c === 2)[0])
    if (pairVal === 1 || pairVal >= 11)  return { name: 'Paire (Valet ou +)',  mult: 1,   rank: 1 }
  }
  return { name: 'Rien', mult: 0, rank: 0 }
}

function Poker({ cookies, onResult, onMentalChange }) {
  const [deck,    setDeck]    = useState([])
  const [hand,    setHand]    = useState([])
  const [held,    setHeld]    = useState([false, false, false, false, false])
  const [bet,     setBet]     = useState(100)
  const [phase,   setPhase]   = useState('idle')   // idle | dealt | done
  const [result,  setResult]  = useState(null)
  const [showRef, setShowRef] = useState(false)

  const maxBet = Math.max(1, cookies)

  const deal = () => {
    if (bet < 1 || bet > cookies) return
    onResult(-bet)
    const d = shuffle([...buildDeck(), ...buildDeck()])
    setDeck(d.slice(5))
    setHand(d.slice(0, 5))
    setHeld([false, false, false, false, false])
    setResult(null)
    setPhase('dealt')
  }

  const toggleHold = (i) => {
    setHeld(h => h.map((v, idx) => idx === i ? !v : v))
  }

  const draw = () => {
    let dk = [...deck]
    const newHand = hand.map((card, i) => {
      if (held[i]) return card
      const c = dk[0]; dk = dk.slice(1); return c
    })
    setDeck(dk)
    setHand(newHand)
    const res = evaluatePokerHand(newHand)
    setResult(res)
    setPhase('done')
    if (res.mult > 0) {
      onResult(Math.floor(bet * res.mult))
      onMentalChange(res.rank >= 6 ? 5 : res.rank >= 3 ? 2 : 1)
    } else {
      onMentalChange(-3)
    }
  }

  const reset = () => {
    setPhase('idle')
    setHand([])
    setHeld([false, false, false, false, false])
    setResult(null)
  }

  return (
    <div className="poker">
      <div className="poker-header">
        <h3>🂡 Poker — 5 Card Draw</h3>
        <button className="btn-poker-ref" onClick={() => setShowRef(r => !r)}>
          {showRef ? '▲ Masquer' : '📋 Combinaisons'}
        </button>
      </div>

      {showRef && (
        <div className="poker-ref">
          <div className="poker-ref-title">Du plus fort au plus faible</div>
          {POKER_COMBOS.map(c => (
            <div key={c.name} className="poker-ref-row">
              <span className="poker-ref-icon">{c.icon}</span>
              <div className="poker-ref-info">
                <span className="poker-ref-name">{c.name}</span>
                <span className="poker-ref-short">{c.short}</span>
              </div>
              <span className="poker-ref-mult">×{c.mult}</span>
            </div>
          ))}
          <div className="poker-ref-row poker-ref-row-zero">
            <span className="poker-ref-icon">❌</span>
            <div className="poker-ref-info">
              <span className="poker-ref-name">Rien</span>
              <span className="poker-ref-short">Paire de 10 ou moins</span>
            </div>
            <span className="poker-ref-mult poker-ref-mult-zero">×0</span>
          </div>
        </div>
      )}

      {hand.length > 0 && (
        <div className="poker-table">
          <div className="poker-hand">
            {hand.map((card, i) => (
              <div
                key={i}
                className={`poker-card-wrap ${held[i] ? 'held' : ''} ${phase === 'dealt' ? 'clickable' : ''}`}
                onClick={() => phase === 'dealt' && toggleHold(i)}
              >
                <span className="hold-label">{held[i] ? '✅ GARDE' : phase === 'dealt' ? '  clic  ' : ''}</span>
                <img src={cardImg(card)} className="poker-card-img" alt={`${cardLabel(card)} ${card.suit}`} />
              </div>
            ))}
          </div>
          {phase === 'dealt' && (
            <p className="poker-hint">Cliquez sur les cartes à garder, puis tirez.</p>
          )}
          {result && (
            <div className={`poker-result ${result.mult > 0 ? 'poker-win' : 'poker-lose'}`}>
              {result.mult > 0
                ? `🎉 ${result.name} — +${fmt(Math.floor(bet * result.mult))} 🍪`
                : `😞 ${result.name} — Perdu ${fmt(bet)} 🍪`}
            </div>
          )}
        </div>
      )}

      <div className="poker-actions">
        {phase === 'idle' && (
          <>
            <div className="bet-row">
              <span>Mise</span>
              <input type="number" className="bet-input" value={bet} min={1} max={maxBet}
                onChange={e => setBet(Math.max(1, Math.min(maxBet, +e.target.value)))} />
              <button className="btn-bet" onClick={() => setBet(b => Math.max(1, Math.floor(b / 2)))}>½</button>
              <button className="btn-bet accent" onClick={() => setBet(b => Math.min(maxBet, b * 2))}>×2</button>
              <button className="btn-bet red" onClick={() => setBet(maxBet)}>MAX</button>
            </div>
            <button className="btn-deal" onClick={deal} disabled={bet > cookies || bet < 1}>
              🂡 Distribuer ({fmt(bet)} 🍪)
            </button>
          </>
        )}
        {phase === 'dealt' && (
          <button className="btn-deal" onClick={draw}>🃏 Tirer les cartes</button>
        )}
        {phase === 'done' && (
          <button className="btn-deal" onClick={reset}>🔄 Nouvelle donne</button>
        )}
      </div>
    </div>
  )
}

// ── Casino wrapper ────────────────────────────────────────────────────────────

// ── Russian Roulette ──────────────────────────────────────────────────────────

const RR_CONFIGS = [
  { b: 1, mult: 1.5,  deathOdds: '17%'  },
  { b: 2, mult: 2.2,  deathOdds: '33%'  },
  { b: 3, mult: 5,  deathOdds: '50%'  },
  { b: 4, mult: 10,    deathOdds: '67%'  },
  { b: 5, mult: 30,   deathOdds: '83%'  },
]

function RussianRoulette({ cookies, onResult, onMentalChange, onDeath }) {
  const [bullets, setBullets]   = useState(1)
  const [phase, setPhase]       = useState('idle')   // idle | spinning | result
  const [survived, setSurvived] = useState(null)
  const [bulletSet, setBulletSet]     = useState(null)
  const [firedChamber, setFiredChamber] = useState(null)

  const cfg = RR_CONFIGS[bullets - 1]
  const bet = Math.max(1, cookies)

  const handleShoot = () => {
    if (cookies < bet || phase !== 'idle') return
    setPhase('spinning')

    // Place bullets in random chambers
    const shuffled = [...Array(6).keys()].sort(() => Math.random() - 0.5)
    const loaded   = new Set(shuffled.slice(0, bullets))
    const fired    = Math.floor(Math.random() * 6)
    const hit      = loaded.has(fired)

    setTimeout(() => {
      setBulletSet(loaded)
      setFiredChamber(fired)
      setSurvived(!hit)
      setPhase('result')
      if (!hit) {
        onResult(Math.floor(bet * (cfg.mult - 1)))
        onMentalChange(-3 * bullets)
      } else {
        onResult(-bet)
        onMentalChange(-50)
        setTimeout(() => onDeath({ name: 'roulette russe 🔫', type: 'roulette' }), 2000)
      }
    }, 1800)
  }

  const reset = () => {
    setSurvived(null)
    setBulletSet(null)
    setFiredChamber(null)
    setPhase('idle')
  }

  return (
    <div className="rr">
      <h2 className="rr-title">🔫 Roulette Russe</h2>
      <p className="rr-subtitle">Choisissez le nombre de balles — plus il y en a, plus le gain est élevé.<br/>Si vous perdez, vous <strong>mourez</strong> et recommencez à zéro.<br/>Vous misez toujours <strong>tous vos cookies</strong>.</p>

      {/* Cylinder */}
      <div className={`rr-cyl-wrap ${phase === 'spinning' ? 'rr-spinning' : ''}`}>
        <svg viewBox="0 0 120 120" width="140" height="140">
          <circle cx="60" cy="60" r="55" fill="#1a1a2e" stroke="#555" strokeWidth="3"/>
          {[0,1,2,3,4,5].map(i => {
            const angle = (i * 60 - 90) * Math.PI / 180
            const cx    = 60 + 33 * Math.cos(angle)
            const cy    = 60 + 33 * Math.sin(angle)
            const hasBullet  = bulletSet?.has(i)
            const isFired    = bulletSet && i === firedChamber
            const fill       = bulletSet ? (hasBullet ? '#cc2222' : '#1e3a1e') : '#2a2a3e'
            const stroke     = isFired ? '#ffffff' : '#555'
            const strokeW    = isFired ? 3 : 1.5
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="12" fill={fill} stroke={stroke} strokeWidth={strokeW}/>
                {isFired && <circle cx={cx} cy={cy} r="4" fill="#fff" opacity="0.85"/>}
              </g>
            )
          })}
          <circle cx="60" cy="60" r="7" fill="#444" stroke="#666" strokeWidth="1.5"/>
        </svg>
      </div>

      {phase === 'spinning' && <p className="rr-status">🌀 Le barillet tourne…</p>}

      {phase === 'result' && (
        <div className={`rr-result-banner ${survived ? 'rr-survived' : 'rr-dead'}`}>
          {survived
            ? `💨 SURVIVANT ! +${fmt(Math.floor(bet * (cfg.mult - 1)))} 🍪`
            : '💀 VOUS ÊTES MORT'}
        </div>
      )}

      {phase === 'idle' && (
        <>
          <div className="rr-config-list">
            {RR_CONFIGS.map(c => (
              <button
                key={c.b}
                className={`rr-config-btn ${bullets === c.b ? 'active' : ''}`}
                onClick={() => setBullets(c.b)}
              >
                <span className="rr-chambers-mini">{'🔴'.repeat(c.b)}{'⚫'.repeat(6 - c.b)}</span>
                <span className="rr-config-meta">×{c.mult} &nbsp;—&nbsp; {c.deathOdds} de mourir</span>
              </button>
            ))}
          </div>

          <p className="rr-all-in">Mise : <strong>{fmt(bet)} 🍪</strong> (tous vos cookies)</p>

          <button
            className="rr-shoot-btn"
            onClick={handleShoot}
            disabled={cookies < 1}
          >
            🔫 Tirer
          </button>
        </>
      )}

      {phase === 'result' && survived && (
        <button className="rr-again-btn" onClick={reset}>🔄 Yes !</button>
      )}
    </div>
  )
}

// ── Casino container ──────────────────────────────────────────────────────────

export default function Casino({ cookies, onResult, onMentalChange, onDeath }) {
  const [tab, setTab] = useState('slots')

  return (
    <div className="casino">
      <div className="casino-tabs">
        <button className={`casino-tab ${tab === 'slots'     ? 'active' : ''}`} onClick={() => setTab('slots')}>🎰 Slots</button>
        <button className={`casino-tab ${tab === 'wheel'     ? 'active' : ''}`} onClick={() => setTab('wheel')}>🎡 Roue</button>
        <button className={`casino-tab ${tab === 'blackjack' ? 'active' : ''}`} onClick={() => setTab('blackjack')}>🃏 Blackjack</button>
        <button className={`casino-tab ${tab === 'poker'     ? 'active' : ''}`} onClick={() => setTab('poker')}>🂡 Poker</button>
        <button className={`casino-tab ${tab === 'roulette'  ? 'active' : ''}`} onClick={() => setTab('roulette')}>🔫 Roulette</button>
      </div>

      {tab === 'slots'     && <SlotMachine     cookies={cookies} onResult={onResult} onMentalChange={onMentalChange} />}
      {tab === 'wheel'     && <Wheel           cookies={cookies} onResult={onResult} onMentalChange={onMentalChange} />}
      {tab === 'blackjack' && <Blackjack       cookies={cookies} onResult={onResult} onMentalChange={onMentalChange} />}
      {tab === 'poker'     && <Poker           cookies={cookies} onResult={onResult} onMentalChange={onMentalChange} />}
      {tab === 'roulette'  && <RussianRoulette cookies={cookies} onResult={onResult} onMentalChange={onMentalChange} onDeath={onDeath} />}
    </div>
  )
}
