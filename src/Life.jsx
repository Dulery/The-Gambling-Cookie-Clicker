import { useState } from 'react'

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}

// ── Starting assets ───────────────────────────────────────────────────────────

export const ASSETS = [
  { id: 'maison',  name: 'Maison',   icon: '🏠', startQty: 1,  price: 5000,  category: 'biens',   mentalImpact: -25 },
  { id: 'voiture', name: 'Voiture',  icon: '🚗', startQty: 1,  price: 2000,  category: 'biens',   mentalImpact: -8  },
  { id: 'enfant',  name: 'Enfant',   icon: '👶', startQty: 2,  price: 3000,  category: 'biens',   mentalImpact: -45 },
  { id: 'chien',   name: 'Chien',    icon: '🐶', startQty: 1,  price: 800,   category: 'biens',   mentalImpact: -20 },
  { id: 'cerveau', name: 'Cerveau',  icon: '🧠', startQty: 1,  price: 20000, category: 'organes', mentalImpact: -60, fatalAtZero: true  },
  { id: 'coeur',   name: 'Cœur',     icon: '❤️', startQty: 1,  price: 15000, category: 'organes', mentalImpact: -60, fatalAtZero: true  },
  { id: 'poumon',  name: 'Poumon',   icon: '🫁', startQty: 2,  price: 8000,  category: 'organes', mentalImpact: -15, fatalAtZero: true  },
  { id: 'rein',    name: 'Rein',     icon: '🫘', startQty: 2,  price: 5000,  category: 'organes', mentalImpact: -10, fatalAtZero: true  },
  { id: 'foie',    name: 'Foie',     icon: '🫀', startQty: 1,  price: 4000,  category: 'organes', mentalImpact: -20, fatalAtZero: true  },
  { id: 'rate',    name: 'Rate',     icon: '🦠', startQty: 1,  price: 2500,  category: 'organes', mentalImpact: -5                     },
  { id: 'oeil',    name: 'Œil',      icon: '👁️', startQty: 2,  price: 1500,  category: 'organes', mentalImpact: -12                    },
  { id: 'oreille', name: 'Oreille',  icon: '👂', startQty: 2,  price: 1000,  category: 'organes', mentalImpact: -6                     },
  { id: 'dent',    name: 'Dent',     icon: '🦷', startQty: 32, price: 200,   category: 'organes', mentalImpact: -1                     },
]

// ── Shop items (resale = 60 % of cost) ───────────────────────────────────────

export const SHOP_ITEMS = [
  { id: 'pizza',   name: 'Pizza',       icon: '🍕', cost: 50,     desc: 'Délicieuse',      mentalBoost: 3  },
  { id: 'biere',   name: 'Bière',       icon: '🍺', cost: 20,     desc: 'Bien fraîche',    mentalBoost: 5  },
  { id: 'chat',    name: 'Chat',        icon: '🐱', cost: 150,    desc: 'Miaou',           mentalBoost: 12 },
  { id: 'tv',      name: 'Télévision',  icon: '📺', cost: 300,    desc: 'HD 4K',           mentalBoost: 5  },
  { id: 'velo',    name: 'Vélo',        icon: '🚲', cost: 500,    desc: 'Pour se balader', mentalBoost: 7  },
  { id: 'phone',   name: 'Smartphone',  icon: '📱', cost: 800,    desc: 'Dernier modèle',  mentalBoost: 5  },
  { id: 'laptop',  name: 'PC Portable', icon: '💻', cost: 1500,   desc: 'Ultra-puissant',  mentalBoost: 6  },
  { id: 'sword',   name: 'Épée',        icon: '⚔️', cost: 2000,   desc: 'Tranchante',      mentalBoost: 4  },
  { id: 'moto',    name: 'Moto',        icon: '🏍️', cost: 5000,   desc: 'Vroooom',         mentalBoost: 10 },
  { id: 'crown',   name: 'Couronne',    icon: '👑', cost: 10000,  desc: 'Royale',          mentalBoost: 12 },
  { id: 'ferrari', name: 'Ferrari',     icon: '🏎️', cost: 30000,  desc: 'Vroom vroom',     mentalBoost: 18 },
  { id: 'yacht',   name: 'Yacht',       icon: '🛥️', cost: 75000,  desc: 'En mer',          mentalBoost: 20 },
  { id: 'villa',   name: 'Villa',       icon: '🏡', cost: 120000, desc: 'Piscine incluse', mentalBoost: 22 },
  { id: 'avion',   name: 'Jet privé',   icon: '✈️', cost: 300000, desc: 'Business class',  mentalBoost: 25 },
  { id: 'rocket',  name: 'Fusée',       icon: '🚀', cost: 500000, desc: "Pour l'espace",   mentalBoost: 30 },
  { id: 'island',  name: 'Île privée',  icon: '🏝️', cost: 999999, desc: 'Paradisiaque',    mentalBoost: 35 },
].map(item => ({ ...item, price: Math.floor(item.cost * 0.6) }))
export const MEDICINES = [
  { id: 'aspirine',  name: 'Aspirine',           icon: '💊', cost: 1000,   mentalBoost: 10,  consumable: true, desc: 'Soulage un peu'          },
  { id: 'prozac',    name: 'Antidépresseurs',     icon: '💊', cost: 8000,   mentalBoost: 25,  consumable: true, desc: 'Remonte le moral'         },
  { id: 'therapie',  name: 'Séance de thérapie',  icon: '🛋️', cost: 25000,  mentalBoost: 50,  consumable: true, desc: 'Parler ça aide'          },
  { id: 'traitement',name: 'Traitement complet',  icon: '💉', cost: 80000,  mentalBoost: 100, consumable: true, desc: 'Santé mentale à 100 %'   },
]
const SHOP_MAP = Object.fromEntries(SHOP_ITEMS.map(i => [i.id, i]))

export function getDefaultAssets() {
  const obj = {}
  for (const a of ASSETS) obj[a.id] = a.startQty
  return obj
}

// ── Affaires ──────────────────────────────────────────────────────────────────

function Affaires({ assets, onSell }) {
  const biens   = ASSETS.filter(a => a.category === 'biens')
  const organes = ASSETS.filter(a => a.category === 'organes')
  const achats  = SHOP_ITEMS.filter(item => (assets[item.id] ?? 0) > 0)

  const isFatalSell = (item) =>
    item.fatalAtZero && (assets[item.id] ?? item.startQty ?? 0) === 1

  const renderCard = (item) => {
    const qty   = assets[item.id] ?? item.startQty ?? 0
    const fatal = isFatalSell(item)
    return (
      <div key={item.id} className={`asset-card ${qty === 0 ? 'asset-sold' : ''} ${fatal ? 'asset-fatal' : ''}`}>
        <span className="asset-icon">{item.icon}</span>
        <div className="asset-info">
          <span className="asset-name">
            {item.name}
            {fatal && qty > 0 && <span className="fatal-badge" title="Organe vital — vendre = mort">☠️</span>}
          </span>
          <span className="asset-qty">
            {qty === 0 ? 'Vendu' : qty > 1 ? `×${qty}` : ''}
          </span>
        </div>
        <div className="asset-right">
          <span className="asset-price">{fmt(item.price)} 🍪</span>
          <button
            className={`btn-sell ${fatal ? 'btn-sell-fatal' : ''}`}
            onClick={() => onSell(item)}
            disabled={qty === 0}
          >
            Vendre
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="affaires">
      <p className="affaires-intro">
        Vendez vos biens et organes pour des cookies. Réfléchissez bien…
      </p>

      <h4 className="asset-category-title">🏡 Biens</h4>
      <div className="assets-list">{biens.map(a => renderCard(a))}</div>

      <h4 className="asset-category-title">🩺 Organes</h4>
      <div className="assets-list">{organes.map(a => renderCard(a))}</div>

      {achats.length > 0 && (
        <>
          <h4 className="asset-category-title">🛍️ Achats</h4>
          <div className="assets-list">{achats.map(a => renderCard(a))}</div>
        </>
      )}
    </div>
  )
}

// ── Boutique ──────────────────────────────────────────────────────────────────

function Boutique({ cookies, assets, onBuy }) {
  return (
    <div className="boutique">
      <p className="affaires-intro">
        Achetez des objets — ils apparaîtront dans vos Affaires et pourront être revendus.
      </p>
      <div className="shop-grid">
        {SHOP_ITEMS.map(item => {
          const owned     = assets[item.id] ?? 0
          const canAfford = cookies >= item.cost
          return (
            <div key={item.id} className={`shop-item ${canAfford ? 'shop-affordable' : 'shop-broke'}`}>
              <span className="shop-icon">{item.icon}</span>
              <div className="shop-info">
                <span className="shop-name">{item.name}</span>
                <span className="shop-desc">{item.desc}</span>
              </div>
              <div className="shop-meta">
                <span className="shop-cost">{fmt(item.cost)} 🍪</span>
                {owned > 0 && <span className="shop-owned">×{owned}</span>}
                <button className="btn-buy" onClick={() => onBuy(item)} disabled={!canAfford}>Acheter</button>
              </div>
            </div>
          )
        })}
      </div>

      <h4 className="asset-category-title" style={{ marginTop: '1.5rem' }}>💊 Médicaments</h4>
      <p className="affaires-intro">Consommables — restaurent immédiatement la santé mentale.</p>
      <div className="shop-grid">
        {MEDICINES.map(item => {
          const canAfford = cookies >= item.cost
          return (
            <div key={item.id} className={`shop-item shop-medicine ${canAfford ? 'shop-affordable' : 'shop-broke'}`}>
              <span className="shop-icon">{item.icon}</span>
              <div className="shop-info">
                <span className="shop-name">{item.name}</span>
                <span className="shop-desc">{item.desc}</span>
              </div>
              <div className="shop-meta">
                <span className="shop-cost">{fmt(item.cost)} 🍪</span>
                <span className="mental-boost-badge">🧠 +{item.mentalBoost}%</span>
                <button className="btn-buy btn-buy-med" onClick={() => onBuy(item)} disabled={!canAfford}>Prendre</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Life wrapper ──────────────────────────────────────────────────────────────

export default function Life({ cookies, assets, onSell, onBuy }) {
  const [tab, setTab] = useState('affaires')

  return (
    <div className="life">
      <div className="life-tabs">
        <button
          className={`life-tab ${tab === 'affaires' ? 'active' : ''}`}
          onClick={() => setTab('affaires')}
        >💼 Affaires</button>
        <button
          className={`life-tab ${tab === 'boutique' ? 'active' : ''}`}
          onClick={() => setTab('boutique')}
        >🛒 Boutique</button>
      </div>

      <div className="life-body">
        {tab === 'affaires' && <Affaires assets={assets} onSell={onSell} />}
        {tab === 'boutique' && <Boutique cookies={cookies} assets={assets} onBuy={onBuy} />}
      </div>
    </div>
  )
}
