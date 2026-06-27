import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, firebaseEnabled } from "../firebase";
import type {
  MistakeMap,
  ProgressMap,
  QuizResultMap,
  UserStats,
} from "../types";

export const emptyStats: UserStats = {
  currentStreak: 0,
  lastActiveDate: null,
  lessonsCompletedCount: 0,
};

export type UserData = {
  progress: ProgressMap;
  quizzes: QuizResultMap;
  stats: UserStats;
  mistakes: MistakeMap;
};

const localKey = (uid: string) => `cc_userdata_${uid}`;

function readLocal(uid: string): UserData {
  try {
    const raw = localStorage.getItem(localKey(uid));
    if (raw) {
      const data = JSON.parse(raw) as Partial<UserData>;
      return {
        progress: data.progress ?? {},
        quizzes: data.quizzes ?? {},
        stats: data.stats ?? { ...emptyStats },
        mistakes: data.mistakes ?? {},
      };
    }
  } catch {
    /* ignore */
  }
  return { progress: {}, quizzes: {}, stats: { ...emptyStats }, mistakes: {} };
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
        quizzes: data.quizzes ?? {},
        stats: data.stats ?? { ...emptyStats },
        mistakes: data.mistakes ?? {},
      };
    }
    return { progress: {}, quizzes: {}, stats: { ...emptyStats }, mistakes: {} };
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
