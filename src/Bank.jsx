import { useState } from 'react'

function fmt(n) {
  const abs = Math.abs(n)
  if (abs >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (abs >= 1e9)  return (n / 1e9).toFixed(1)  + 'B'
  if (abs >= 1e6)  return (n / 1e6).toFixed(1)  + 'M'
  if (abs >= 1e3)  return (n / 1e3).toFixed(1)  + 'K'
  return Math.floor(n).toString()
}

const LOAN_OFFERS = [
  { id: 'micro',    label: 'Micro-prêt',    icon: '🪙', amount: 500,   fee: 0.20 },
  { id: 'standard', label: 'Prêt Standard', icon: '💳', amount: 2000,  fee: 0.25 },
  { id: 'grand',    label: 'Grand Prêt',    icon: '💰', amount: 10000, fee: 0.35 },
  { id: 'mega',     label: 'Méga Prêt',     icon: '🏛️', amount: 50000, fee: 0.50 },
]

const REPAY_AMOUNTS = [100, 500, 2000, 10000]

export default function Bank({ cookies, loan, onBorrow, onRepay }) {
  const isInDebt = cookies < 0

  return (
    <div className="bank">
      <div className="bank-header">
        <span className="bank-title-icon">🏦</span>
        <div>
          <h2 className="bank-title">Banque des Cookies</h2>
          <p className="bank-subtitle">Empruntez des cookies… à vos risques et périls.</p>
        </div>
      </div>

      {/* Status cards */}
      <div className="bank-status">
        <div className={`bank-balance-card ${isInDebt ? 'negative' : 'positive'}`}>
          <span className="bank-balance-label">Solde actuel</span>
          <span className="bank-balance-value">
            {isInDebt ? '−' : '+'}{fmt(Math.abs(cookies))} 🍪
          </span>
          {isInDebt && (
            <span className="bank-interest-note">⚠️ Solde négatif</span>
          )}
        </div>

        {loan > 0 && (
          <div className="bank-loan-card">
            <span className="bank-balance-label">Dette totale</span>
            <span className="bank-balance-value red">{fmt(loan)} 🍪</span>
            <span className="bank-interest-note">📈 +1% toutes les 30 sec</span>
          </div>
        )}
      </div>

      {loan > 0 && (
        <div className="bank-warning">
          ⚠️ Vous avez une dette de <strong>{fmt(loan)} 🍪</strong>. Les intérêts
          s'accumulent toutes les 30 secondes. Remboursez avant que ça empire !
        </div>
      )}

      {/* Borrow section */}
      <section className="bank-section">
        <h3 className="bank-section-title">💳 Emprunter</h3>
        <p className="bank-section-desc">
          Les frais sont prélevés immédiatement sur la dette. Les intérêts s'appliquent ensuite.
        </p>
        <div className="bank-offers">
          {LOAN_OFFERS.map(offer => {
            const totalOwed = Math.ceil(offer.amount * (1 + offer.fee))
            return (
              <div key={offer.id} className="bank-offer">
                <div className="bank-offer-header">
                  <span className="bank-offer-icon">{offer.icon}</span>
                  <div>
                    <span className="bank-offer-name">{offer.label}</span>
                    <span className="bank-offer-fee">+{Math.round(offer.fee * 100)}% frais</span>
                  </div>
                </div>
                <div className="bank-offer-amounts">
                  <span className="bank-offer-row">
                    Vous recevez&nbsp;
                    <strong className="green">+{fmt(offer.amount)} 🍪</strong>
                  </span>
                  <span className="bank-offer-row">
                    Dette ajoutée&nbsp;
                    <strong className="red">{fmt(totalOwed)} 🍪</strong>
                  </span>
                </div>
                <button
                  className="btn-borrow"
                  onClick={() => onBorrow(offer.amount, totalOwed)}
                >
                  Emprunter
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Repay section */}
      {loan > 0 && (
        <section className="bank-section">
          <h3 className="bank-section-title">💸 Rembourser</h3>
          <p className="bank-section-desc">
            Dette restante : <strong className="red">{fmt(loan)} 🍪</strong>
          </p>
          <div className="bank-repay-grid">
            {REPAY_AMOUNTS.map(amt => (
              <button
                key={amt}
                className="btn-repay"
                disabled={cookies < amt || loan <= 0}
                onClick={() => onRepay(amt)}
              >
                Payer {fmt(amt)} 🍪
              </button>
            ))}
            <button
              className="btn-repay btn-repay-all"
              disabled={cookies < loan}
              onClick={() => onRepay(loan)}
            >
              Tout rembourser ({fmt(loan)} 🍪)
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
