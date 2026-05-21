import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export async function saveScore(userId, data) {
  const ref = doc(db, 'scores', userId)
  await setDoc(ref, data, { merge: true })
}

export async function loadScore(userId) {
  const ref = doc(db, 'scores', userId)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

export async function getLeaderboard(maxResults = 50) {
  const q = query(collection(db, 'scores'), orderBy('cookies', 'desc'), limit(maxResults))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
