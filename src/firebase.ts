import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  type GenerativeModel,
} from "firebase/ai";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Firebase is "enabled" only when a real config is supplied via env vars.
 * Without it, the app falls back to local (offline) auth + persistence so it
 * remains fully testable. Production deployments must set the VITE_FIREBASE_*
 * variables (see .env.example).
 */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

/**
 * The Gemini model used by the AI ant mascot's "Explain more" coaching.
 * `gemini-2.5-flash-lite` has the most generous free-tier (Gemini Developer API
 * on the Spark plan) headroom, which is plenty for the rare, on-demand calls the
 * mascot makes.
 */
const COACH_MODEL = "gemini-2.5-flash-lite";

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let coachModelInstance: GenerativeModel | undefined;

if (firebaseEnabled) {
  app = initializeApp(config);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
}

export const auth = authInstance;
export const db = dbInstance;

/**
 * Lazily create the mascot's generative model via Firebase AI Logic, using the
 * (free-tier capable) Gemini Developer API backend. Returns `undefined` when
 * Firebase is disabled (offline/tests) so callers can fall back to authored
 * hints. Created on first use to avoid spinning up the AI SDK at startup.
 */
export function getCoachModel(): GenerativeModel | undefined {
  if (!app) return undefined;
  if (!coachModelInstance) {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    coachModelInstance = getGenerativeModel(ai, { model: COACH_MODEL });
  }
  return coachModelInstance;
}
