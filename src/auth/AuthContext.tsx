import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, firebaseEnabled } from "../firebase";
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
} from "./auth-context";

const LOCAL_USERS_KEY = "cc_local_users";
const LOCAL_SESSION_KEY = "cc_local_session";

type LocalUser = { uid: string; email: string; password: string };

function readLocalUsers(): LocalUser[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeLocalUsers(users: LocalUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function toFriendlyError(err: unknown): Error {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "That email is already registered.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
  };
  return new Error(map[code] ?? (err as Error)?.message ?? "Something went wrong.");
}

function readLocalSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // In local mode the session is known synchronously from localStorage, so we
  // can seed it via a lazy initializer instead of a setState inside an effect.
  const [user, setUser] = useState<AuthUser | null>(() =>
    firebaseEnabled && auth ? null : readLocalSession(),
  );
  const [loading, setLoading] = useState(() => Boolean(firebaseEnabled && auth));

  useEffect(() => {
    if (!(firebaseEnabled && auth)) return;
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser ? { uid: fbUser.uid, email: fbUser.email ?? "" } : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const setLocalSession = (u: AuthUser | null) => {
      if (u) localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
      else localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(u);
    };

    return {
      user,
      loading,
      async signUp(email, password) {
        const normalized = email.trim().toLowerCase();
        if (firebaseEnabled && auth) {
          try {
            await createUserWithEmailAndPassword(auth, normalized, password);
          } catch (err) {
            throw toFriendlyError(err);
          }
          return;
        }
        if (password.length < 6) {
          throw new Error("Password should be at least 6 characters.");
        }
        const users = readLocalUsers();
        if (users.some((u) => u.email === normalized)) {
          throw new Error("That email is already registered.");
        }
        const newUser: LocalUser = {
          uid: `local_${Date.now()}`,
          email: normalized,
          password,
        };
        writeLocalUsers([...users, newUser]);
        setLocalSession({ uid: newUser.uid, email: newUser.email });
      },
      async signIn(email, password) {
        const normalized = email.trim().toLowerCase();
        if (firebaseEnabled && auth) {
          try {
            await signInWithEmailAndPassword(auth, normalized, password);
          } catch (err) {
            throw toFriendlyError(err);
          }
          return;
        }
        const users = readLocalUsers();
        const match = users.find(
          (u) => u.email === normalized && u.password === password,
        );
        if (!match) throw new Error("Incorrect email or password.");
        setLocalSession({ uid: match.uid, email: match.email });
      },
      async logOut() {
        if (firebaseEnabled && auth) {
          await signOut(auth);
          return;
        }
        setLocalSession(null);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
