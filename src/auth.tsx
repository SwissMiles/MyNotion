import React, { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";

type OAuthStrategy = "oauth_google" | "oauth_github";

const BASE = import.meta.env.BASE_URL;

/** Social-only sign-in — password / email login is intentionally not offered. */
export function SignInScreen() {
  const { signIn, isLoaded } = useSignIn();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<OAuthStrategy | null>(null);

  function oauth(strategy: OAuthStrategy) {
    if (!signIn) return;
    setBusy(strategy);
    setError("");
    signIn
      .authenticateWithRedirect({
        strategy,
        redirectUrl: `${BASE}sso-callback`,
        redirectUrlComplete: BASE,
      })
      .catch(() => {
        setBusy(null);
        setError("Couldn't start sign-in. Please try again.");
      });
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">🎓</div>
        <h1>MyNotion</h1>
        <p className="muted">
          Semesters, courses, notes, assignments, grades and timetables — synced to your account.
        </p>
        <button
          className="auth-btn"
          disabled={!isLoaded || busy !== null}
          onClick={() => oauth("oauth_google")}
        >
          <GoogleIcon />
          {busy === "oauth_google" ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          className="auth-btn"
          disabled={!isLoaded || busy !== null}
          onClick={() => oauth("oauth_github")}
        >
          <GitHubIcon />
          {busy === "oauth_github" ? "Redirecting…" : "Continue with GitHub"}
        </button>
        {error && <p className="auth-error">{error}</p>}
        <p className="auth-fineprint">No passwords — sign in with the account you already have.</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l4-3.09z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.43-3.43A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l4 3.09C6.23 6.88 8.88 4.77 12 4.77z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
