import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import Login from "./pages/Login";
import CoursePath from "./pages/CoursePath";
import LessonPlayer from "./pages/LessonPlayer";
import type { ReactNode } from "react";

function FullScreenLoader() {
  return (
    <div className="flex h-full items-center justify-center text-slate-400">
      Loading...
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Keyed by lessonId so navigating between lessons remounts the player and
// resets its internal slide/finished state instead of reusing the previous
// lesson's state.
function LessonPlayerRoute() {
  const { lessonId } = useParams();
  return <LessonPlayer key={lessonId} />;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col bg-[#f6f8fb]">
      <Routes>
        <Route
          path="/login"
          element={
            loading ? (
              <FullScreenLoader />
            ) : user ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <CoursePath />
            </RequireAuth>
          }
        />
        <Route
          path="/lesson/:lessonId"
          element={
            <RequireAuth>
              <LessonPlayerRoute />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
