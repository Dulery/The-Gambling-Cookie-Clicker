import { useState } from 'react'

function fmt(n) {
  const abs = Math.abs(n)
  if (abs >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (abs >= 1e9)  return (n / 1e9).toFixed(1)  + 'B'
  if (abs >= 1e6)  return (n / 1e6).toFixed(1)  + 'M'
  if (abs >= 1e3)  return (n / 1e3).toFixed(1)  + 'K'
  return Math.floor(n).toString()
}


const REPAY_AMOUNTS = [100, 500, 2000, 10000]

export default function Bank({ cookies, loan, onBorrow, onRepay }) {
  const isNegative      = cookies < 0
  const emergencyAmount = isNegative ? Math.abs(cookies) : 0
  const emergencyDebt   = Math.ceil(emergencyAmount * 1.25)

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
        <div className={`bank-balance-card ${isNegative ? 'negative' : 'positive'}`}>
          <span className="bank-balance-label">Solde actuel</span>
          <span className="bank-balance-value">
            {isNegative ? '−' : '+'}{fmt(Math.abs(cookies))} 🍪
          </span>
          {isNegative && (
            <span className="bank-interest-note">⚠️ Solde négatif</span>
          )}
        </div>

        {loan > 0 && (
          <div className="bank-loan-card">
            <span className="bank-balance-label">Dette totale</span>
            <span className="bank-balance-value red">{fmt(loan)} 🍪</span>
            <span className="bank-interest-note">📈 +2% toutes les 20 sec</span>
          </div>
        )}
      </div>

      {loan > 0 && (
        <div className="bank-warning">
          ⚠️ Vous avez une dette de <strong>{fmt(loan)} 🍪</strong>.<br/>
          📈 +2% d’intérêts toutes les 20 secondes — la dette grossit si vous ne remboursez pas.<br/>
          🧠 <strong>−10 de santé mentale</strong> à chaque tick d’intérêt — si votre santé mentale atteint 0, vous mourez et tout est perdu.
        </div>
      )}

            {/* Emergency loan */}
      <section className="bank-section">
        <h3 className="bank-section-title">🚨 Prêt d’urgence</h3>
        {isNegative ? (
          <>
            <p className="bank-section-desc">
              Votre solde est de <strong className="red">−{fmt(emergencyAmount)} 🍪</strong>.<br/>
              La banque peut vous remettre à zéro en contrepartie d’une dette de <strong className="red">{fmt(emergencyDebt)} 🍪</strong> (+25% de frais).
            </p>
            <button className="btn-borrow" onClick={() => onBorrow(emergencyAmount, emergencyDebt)}>
              Contracter le prêt d’urgence (+{fmt(emergencyAmount)} 🍪)
            </button>
          </>
        ) : (
          <p className="bank-section-desc" style={{color: 'var(--text-muted)'}}>
            ✅ Votre solde est positif, vous n’avez pas besoin d’un prêt.
          </p>
        )}
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
