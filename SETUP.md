# 🍪 Cookie Clicker — Guide de configuration

Suis ce guide **dans l'ordre** depuis zéro.

---

## 1. Installer les dépendances

```bash
cd /home/lauricdulery/Lauric/zitadel
npm install
```

---

## 2. Configurer Zitadel (auth)

### 2.1 Créer un compte Zitadel Cloud

1. Va sur **https://zitadel.cloud** → clique **Start for free**
2. Crée ton compte (email + mot de passe)
3. À la création, Zitadel te donne automatiquement une **organisation** et une **instance**.  
   Note bien l'URL de ton instance, elle ressemble à :  
   `https://mon-app-abc123.zitadel.cloud`

---

### 2.2 Créer un projet

1. Dans la console Zitadel → menu gauche → **Projects** → **Create New Project**
2. Nom : `CookieClicker` → **Continue**

---

### 2.3 Créer une application Web (PKCE)

1. Dans ton projet → **Applications** → **Create New App**
2. Remplis :
   - **Name** : `CookieClicker Web`
   - **Type** : `Web`  
   → **Continue**
3. **Auth Method** : sélectionne **PKCE** (jamais de secret pour une SPA !)  
   → **Continue**
4. **Redirect URIs** — ajoute :
   ```
   http://localhost:5173
   ```
5. **Post Logout Redirect URIs** — ajoute :
   ```
   http://localhost:5173
   ```
6. → **Create**

7. Sur la page de l'application créée, copie le **Client ID** (tu en auras besoin pour le `.env`).

---

### 2.4 Activer la connexion Google

> Optionnel — fait seulement si tu veux le bouton "Se connecter avec Google"

**Étape A : Créer des credentials Google OAuth**

1. Va sur **https://console.cloud.google.com**
2. Crée un nouveau projet (ou utilise un existant)
3. Menu → **APIs & Services** → **OAuth consent screen** → configure comme **External**
4. Menu → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
   - Type : **Web application**
   - **Authorized redirect URIs** : ajoute l'URL de callback de Zitadel :  
     `https://TON_INSTANCE.zitadel.cloud/oauth/v2/idps/callback`
5. Copie le **Client ID** et le **Client Secret** Google.

**Étape B : Ajouter Google dans Zitadel**

1. Dans la console Zitadel → **Identity Providers** (dans le menu de ton organisation, pas du projet)
2. → **Add Provider** → **Google**
3. Colle le **Client ID** et **Client Secret** Google
4. → **Create**
5. Retourne dans ton **Projet** → **Identity Providers** → active Google

---

### 2.5 Activer la connexion par mot de passe

Par défaut Zitadel permet déjà l'inscription/connexion par email + mot de passe.  
Si ce n'est pas le cas : **Organisation** → **Settings** → **Login Behaviour** → active **Username/Password**.

---

## 3. Configurer Firebase (base de données)

### 3.1 Créer un projet Firebase

1. Va sur **https://console.firebase.google.com**
2. → **Create a project** → nom : `cookie-clicker`
3. Désactive Google Analytics si tu veux (optionnel) → **Create project**

---

### 3.2 Créer une app Web

1. Dans ton projet Firebase → clique l'icône **`</>`** (Web)
2. Nom : `cookie-clicker-web` → **Register app**
3. Firebase te donne un objet `firebaseConfig` — **copie ces valeurs** (tu en auras besoin pour le `.env`)

---

### 3.3 Activer Firestore

1. Menu gauche → **Firestore Database** → **Create database**
2. Choisis **Start in test mode** (accès libre pendant 30 jours, parfait pour développer)
3. Choisis une région proche de toi (ex: `europe-west1`) → **Enable**

> ⚠️ **Pour la production**, remplace les règles Firestore par celles-ci (dans Firestore → Rules) :
> ```
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /scores/{userId} {
>       allow read, write: if true; // À sécuriser avec un backend si besoin
>     }
>   }
> }
> ```

---

## 4. Créer le fichier .env

```bash
cp .env.example .env
```

Ouvre `.env` et remplis les valeurs :

```env
# L'URL de ton instance Zitadel (sans slash final)
VITE_ZITADEL_AUTHORITY=https://TON_INSTANCE.zitadel.cloud

# Le Client ID de l'app "CookieClicker Web" dans Zitadel
VITE_ZITADEL_CLIENT_ID=1234567890123456789

# Les valeurs copiées depuis Firebase (firebaseConfig)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=cookie-clicker-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cookie-clicker-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=cookie-clicker-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

---

## 5. Lancer le projet

```bash
npm run dev
```

Ouvre **http://localhost:5173** dans ton navigateur.

---

## 6. Récapitulatif des URLs à enregistrer dans Zitadel

| Champ Zitadel | Valeur (dev local) |
|---|---|
| Redirect URI | `http://localhost:5173` |
| Post Logout Redirect URI | `http://localhost:5173` |

Pour un déploiement en production, remplace `http://localhost:5173` par ton vrai domaine dans les deux champs.

---

## Structure du projet

```
src/
├── main.jsx        # Point d'entrée + AuthProvider Zitadel
├── App.jsx         # Routing auth (login / game)
├── Game.jsx        # Le jeu (clicker + upgrades + sauvegarde)
├── firebase.js     # Fonctions save/load Firestore
└── index.css       # Styles
```
