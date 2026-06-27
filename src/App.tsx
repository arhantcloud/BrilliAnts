import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "./auth/auth-context";
import Login from "./pages/Login";
import CoursePath from "./pages/CoursePath";
import LessonPlayer from "./pages/LessonPlayer";
import QuizPlayer from "./pages/QuizPlayer";
import AntColony from "./pages/AntColony";
import AntMascot from "./mascot/AntMascot";
import type { ReactNode } from "react";

function FullScreenLoader() {
  return (
    <div className="flex h-full items-center justify-center text-stone-400">
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

// Keyed by lessonId so switching quizzes remounts the player and rebuilds a
// fresh question set instead of reusing the previous lesson's quiz state.
function QuizPlayerRoute() {
  const { lessonId } = useParams();
  return <QuizPlayer key={lessonId} />;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <div className="flex h-full w-full flex-col bg-[#f7f1ea]">
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
        <Route
          path="/quiz/:lessonId"
          element={
            <RequireAuth>
              <QuizPlayerRoute />
            </RequireAuth>
          }
        />
        <Route
          path="/colony"
          element={
            <RequireAuth>
              <AntColony />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <AntMascot />}
    </div>
  );
}
