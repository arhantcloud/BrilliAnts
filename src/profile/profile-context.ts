import { createContext, useContext } from "react";

/** The customizable identity shown as the learner's avatar icon. */
export type Profile = {
  username: string;
  /** Ant body colour. */
  antColor: string;
  /** Avatar disc background colour. */
  bgColor: string;
};

export const DEFAULT_PROFILE: Profile = {
  username: "",
  antColor: "#a44a26", // brand-600
  bgColor: "#f9e3d4", // brand-100
};

export type ProfileContextValue = {
  profile: Profile;
  /** Replace the whole profile (persists). */
  setProfile: (next: Profile) => void;
  /** Patch one or more fields (persists). */
  update: (patch: Partial<Profile>) => void;
};

export const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
