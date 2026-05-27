# 🍪 The Gambling Cookie Clicker

Un Cookie Clicker avec casino, banque, santé mentale et classement en ligne.  
Démo live : **https://the-gambling-cookie-clicker.vercel.app**

---

## Concept

Tu cliques sur un cookie pour en gagner. Avec tes cookies tu peux :

- **Acheter des upgrades** passifs (curseurs, grand-mères, fermes, portails dimensionnels…) qui génèrent des cookies automatiquement, et des upgrades de clic qui augmentent les gains par clic.
- **Jouer au casino** : machines à sous, roue de la fortune, blackjack, poker, roulette russe. Tu peux tout perdre.
- **Contracter un prêt d'urgence** à la banque quand ton solde est négatif — avec 25% de frais et des intérêts de +2% toutes les 20 secondes qui font baisser ta santé mentale.
- **Gérer ta vie** : vendre tes biens (maison, voiture, organes…) pour renflouer ton compte, acheter des soins pour remonter ta santé mentale.
- **Mourir** si ta santé mentale tombe à 0, si tu perds à la roulette russe, ou si tu vends trop d'organes vitaux. La partie recommence à zéro.
- **Voir le classement** des meilleurs joueurs en temps réel.

La progression est sauvegardée en continu sur Firebase Firestore, liée à ton compte.

---

## Stack technique

| Élément | Technologie |
|---|---|
| Framework | React 18 + Vite |
| Auth | [Zitadel](https://zitadel.com) (OIDC / PKCE) |
| Base de données | Firebase Firestore |
| Déploiement | Vercel |
| Analytics | @vercel/analytics |

---

## Prérequis

- Node.js ≥ 18
- Un compte [Zitadel Cloud](https://zitadel.cloud) (gratuit)
- Un compte [Firebase](https://console.firebase.google.com) (gratuit)

---

## Installation

```bash
git clone https://github.com/Dulery/The-Gambling-Cookie-Clicker.git
cd The-Gambling-Cookie-Clicker
npm install
```

---

## Configuration

### 1. Zitadel (authentification)

1. Va sur **https://zitadel.cloud** → crée un compte → note l'URL de ton instance (ex: `https://mon-app-abc123.zitadel.cloud`).
2. Crée un **Project** → puis une **Application** :
   - Type : **Web**
   - Auth Method : **PKCE** (jamais de client secret pour une SPA)
   - Redirect URI : `http://localhost:5173`
   - Post Logout Redirect URI : `http://localhost:5173`
3. Copie le **Client ID** généré.

> Pour la production, remplace `http://localhost:5173` par ton domaine dans les deux champs.

---

### 2. Firebase (base de données)

1. Va sur **https://console.firebase.google.com** → crée un projet.
2. Ajoute une app **Web** → copie l'objet `firebaseConfig`.
3. Active **Firestore Database** → choisis **Start in test mode** → sélectionne une région.

Règles Firestore recommandées pour la production :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{userId} {
      allow read, write: if true;
    }
  }
}
```

---

### 3. Fichier `.env`

Crée un fichier `.env` à la racine du projet :

```env
# Zitadel
VITE_ZITADEL_AUTHORITY=https://TON_INSTANCE.zitadel.cloud
VITE_ZITADEL_CLIENT_ID=1234567890123456789

# Firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=cookie-clicker-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cookie-clicker-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=cookie-clicker-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## Lancement

```bash
npm run dev
```

Ouvre **http://localhost:5173**.

```bash
npm run build    # build de production
npm run preview  # prévisualiser le build
```

---

## Déploiement sur Vercel

1. Pousse le projet sur GitHub.
2. Importe le repo sur [vercel.com](https://vercel.com).
3. Ajoute toutes les variables `VITE_*` dans **Settings → Environment Variables**.
4. Dans Zitadel, ajoute ton domaine Vercel aux **Redirect URIs** et **Post Logout Redirect URIs**.
5. Déploie — Vercel détecte automatiquement Vite.

Le fichier `vercel.json` gère le routing SPA :

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## Structure du projet

```
src/
├── main.jsx        # Point d'entrée — AuthProvider OIDC + Analytics
├── App.jsx         # Routing auth (écran de login / jeu)
├── Game.jsx        # État global du jeu, upgrades, sauvegarde Firebase
├── Casino.jsx      # Machines à sous, roue, blackjack, poker, roulette russe
├── Bank.jsx        # Prêt d'urgence et remboursement
├── Life.jsx        # Gestion des biens, soins, santé mentale
├── firebase.js     # saveScore / loadScore / getLeaderboard
└── index.css       # Tous les styles
public/
├── Clover/         # Images des cartes (trèfle)
├── Diamond/        # Images des cartes (carreau)
├── Heart/          # Images des cartes (cœur)
└── Spade/          # Images des cartes (pique)
```

---

## Jeux du casino

| Jeu | Description | Mise max |
|---|---|---|
| 🎰 Machines à sous | 3 rouleaux, 6 symboles, jusqu'à ×18 | Tout |
| 🎡 Roue de la fortune | 12 segments, gains et pertes variables | Tout |
| 🃏 Blackjack | Blackjack paie ×2.2, victoire ×2 | Tout |
| ♠ Poker | 5-card draw, Quinte Flush Royale à ×250 | Tout |
| 🔫 Roulette russe | 1 à 5 balles, jusqu'à ×30 — perdre = mort | Tout |

---

## Mécanique de mort

Le joueur meurt si :
- La **santé mentale** tombe à 0 (dettes non remboursées, pertes au casino…)
- Il **perd à la roulette russe**
- Il vend des **organes vitaux** (cœur, cerveau, poumon…)

À la mort : cookies, upgrades, biens et prêts sont remis à zéro.

---

## Licence

Projet personnel / open source. Fais-en ce que tu veux.
