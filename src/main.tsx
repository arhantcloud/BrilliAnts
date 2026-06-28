import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { ProgressProvider } from "./progress/ProgressContext";
import { ProfileProvider } from "./profile/ProfileContext";
import { MascotProvider } from "./mascot/MascotContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProgressProvider>
          <ProfileProvider>
            <MascotProvider>
              <App />
            </MascotProvider>
          </ProfileProvider>
        </ProgressProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
