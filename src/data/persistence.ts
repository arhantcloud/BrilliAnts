import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, firebaseEnabled } from "../firebase";
import type { ProgressMap, UserStats } from "../types";

export const emptyStats: UserStats = {
  currentStreak: 0,
  lastActiveDate: null,
  lessonsCompletedCount: 0,
};

type UserData = {
  progress: ProgressMap;
  stats: UserStats;
};

const localKey = (uid: string) => `cc_userdata_${uid}`;

function readLocal(uid: string): UserData {
  try {
    const raw = localStorage.getItem(localKey(uid));
    if (raw) return JSON.parse(raw) as UserData;
  } catch {
    /* ignore */
  }
  return { progress: {}, stats: { ...emptyStats } };
}

function writeLocal(uid: string, data: UserData) {
  localStorage.setItem(localKey(uid), JSON.stringify(data));
}

export async function loadUserData(uid: string): Promise<UserData> {
  if (firebaseEnabled && db) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<UserData>;
      return {
        progress: data.progress ?? {},
        stats: data.stats ?? { ...emptyStats },
      };
    }
    return { progress: {}, stats: { ...emptyStats } };
  }
  return readLocal(uid);
}

export async function saveUserData(
  uid: string,
  data: UserData,
): Promise<void> {
  if (firebaseEnabled && db) {
    const ref = doc(db, "users", uid);
    await setDoc(ref, data, { merge: true });
    return;
  }
  writeLocal(uid, data);
}
