import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/auth-context";
import { firebaseEnabled } from "../firebase";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") await signUp(email, password);
      else await signIn(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 shadow-lg">
          <svg
            viewBox="0 0 64 64"
            className="h-10 w-10"
            role="img"
            aria-label="ant"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* antennae */}
            <path d="M29 13 L23 5" />
            <path d="M35 13 L41 5" />
            {/* left legs */}
            <path d="M30 28 L18 22 L9 24" />
            <path d="M30 31 L16 31 L7 33" />
            <path d="M30 34 L18 40 L9 47" />
            {/* right legs */}
            <path d="M34 28 L46 22 L55 24" />
            <path d="M34 31 L48 31 L57 33" />
            <path d="M34 34 L46 40 L55 47" />
            {/* body: head, thorax, abdomen */}
            <ellipse cx="32" cy="15" rx="6" ry="5.5" fill="white" stroke="none" />
            <ellipse cx="32" cy="30" rx="5" ry="7" fill="white" stroke="none" />
            <ellipse cx="32" cy="47" rx="8.5" ry="10" fill="white" stroke="none" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Brilli-Ants
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Learn to count anything, one short lesson at a time.
        </p>
      </div>

      <div className="card p-5">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg py-2 transition ${
              mode === "signup"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-lg py-2 transition ${
              mode === "signin"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Log in
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Password
            </label>
            <input
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy
              ? "Please wait..."
              : mode === "signup"
                ? "Start learning"
                : "Log in"}
          </button>
        </form>
      </div>

      {!firebaseEnabled && (
        <p className="mt-4 text-center text-xs text-slate-400">
          Running in offline mode. Accounts are stored on this device. Add
          Firebase keys in <code>.env</code> for real cross-device sync.
        </p>
      )}
      </div>
    </div>
  );
}
