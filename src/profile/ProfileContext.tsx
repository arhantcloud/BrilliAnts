import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth/auth-context";
import {
  DEFAULT_PROFILE,
  ProfileContext,
  type Profile,
} from "./profile-context";

const storageKey = (uid: string) => `cc_profile_${uid}`;

/** A friendly default username derived from the account email. */
function defaultName(email: string): string {
  const base = (email || "").split("@")[0];
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Ant keeper";
}

function loadProfile(uid: string, email: string): Profile {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (raw) {
      const p = JSON.parse(raw) as Partial<Profile>;
      return {
        username: p.username || defaultName(email),
        antColor: p.antColor || DEFAULT_PROFILE.antColor,
        bgColor: p.bgColor || DEFAULT_PROFILE.bgColor,
      };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PROFILE, username: defaultName(email) };
}

/**
 * Stores the learner's avatar identity (username + ant/background colours).
 * Kept in localStorage per uid so it survives logout/login without touching the
 * Firestore document shape (and therefore needs no security-rules change).
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    setProfileState(user ? loadProfile(user.uid, user.email) : DEFAULT_PROFILE);
  }, [user]);

  const persist = useCallback(
    (next: Profile) => {
      if (user) localStorage.setItem(storageKey(user.uid), JSON.stringify(next));
    },
    [user],
  );

  const setProfile = useCallback(
    (next: Profile) => {
      setProfileState(next);
      persist(next);
    },
    [persist],
  );

  const update = useCallback(
    (patch: Partial<Profile>) => {
      setProfileState((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  return (
    <ProfileContext.Provider value={{ profile, setProfile, update }}>
      {children}
    </ProfileContext.Provider>
  );
}
