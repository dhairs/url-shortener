import Head from "next/head";
import { useState, useEffect } from "react";
import { getClientAuth, getGoogleProvider } from "../lib/firebase-client-auth";
import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";

interface UserState {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

export default function Home() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<UserState | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [slug, setSlug] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check auth status on load
  const checkAuthStatus = async () => {
    try {
      const res = await fetch("/api/auth/status");
      if (res.ok) {
        const data = await res.json();
        if (data.isAuthenticated && data.user) {
          setUser(data.user);
          setIsAuthorized(data.isAuthorized);
        } else {
          setUser(null);
          setIsAuthorized(false);
        }
      }
    } catch (err) {
      console.error("Auth status check failed:", err);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleSignIn = async () => {
    setError(null);
    setCheckingAuth(true);
    try {
      const auth = getClientAuth();
      const provider = getGoogleProvider();

      // 1. Sign in client-side with Google Popup
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // 2. Set HttpOnly session cookie on the server
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Server failed to establish session cookie");
      }

      // 3. Fetch status to confirm authorization
      await checkAuthStatus();
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setError(err.message || "Authentication failed. Please try again.");
      setCheckingAuth(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setCheckingAuth(true);
    setSuccessLink(null);
    try {
      // 1. Client-side sign out
      try {
        const auth = getClientAuth();
        await firebaseSignOut(auth);
      } catch (authErr) {
        console.warn("Client auth sign-out bypassed:", authErr);
      }

      // 2. Clear server cookie
      await fetch("/api/auth/session", { method: "DELETE" });

      setUser(null);
      setIsAuthorized(false);
    } catch (err) {
      console.error("Sign out failed:", err);
      setError("Failed to clear session securely.");
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !url) {
      setError("Both slug and destination URL are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessLink(null);

    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, url }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create short URL");
      }

      // Success
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setSuccessLink(`${origin}/${data.slug}`);
      setSlug("");
      setUrl("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (successLink) {
      navigator.clipboard.writeText(successLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>link shortener | Dhairya Gupta</title>
        <meta name="description" content="Custom link shortener." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header bar showing auth state */}
      <div className="headerInfo">
        <span></span>
        {user && (
          <div className="userBadge">
            {user.picture && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={user.picture} alt={user.name || "User Avatar"} className="userAvatar" />
            )}
            <span>{user.email}</span>
            <span style={{ color: "#767680" }}>|</span>
            <button
              onClick={handleSignOut}
              style={{
                background: "none",
                border: "none",
                color: "#f3ddb6",
                cursor: "pointer",
                padding: 0,
                fontFamily: "inherit",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <main className="main">
        {checkingAuth ? (
          <div style={{ textAlign: "center" }}>
            <div className="spinner"></div>
          </div>
        ) : !user ? (
          /* Sign In UI */
          <div className="glassCard">
            {error && (
              <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "1.5rem", textAlign: "center" }}>
                {error}
              </div>
            )}

            <button onClick={handleSignIn} className="btnPrimary btnGoogle" style={{ marginTop: 0 }}>
              {/* Google G Logo SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.72v2.24h2.9c1.7-1.57 2.7-3.88 2.7-6.6z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.9-2.24c-.8.54-1.84.87-3.06.87-2.35 0-4.34-1.58-5.05-3.72H.93v2.3C2.4 15.98 5.48 18 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.95 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V5.01H.93C.33 6.2 0 7.57 0 9s.33 2.8 1.05 4L3.95 10.7z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.05C13.46.62 11.43 0 9 0 5.48 0 2.4 2.02.93 5.01l3.02 2.31C4.66 5.18 6.65 3.58 9 3.58z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        ) : !isAuthorized ? (
          /* Access Denied UI */
          <div className="glassCard accessDeniedCard">
            <p className="editorialSubtitle" style={{ marginBottom: "1.5rem" }}>
              Unauthorized account: <strong>{user.email}</strong>
            </p>

            <button onClick={handleSignOut} className="btnPrimary" style={{ marginTop: 0 }}>
              Log Out
            </button>
          </div>
        ) : (
          /* Shortener Admin Form UI */
          <div className="glassCard">
            <form onSubmit={handleSubmit}>
              <div className="formGroup">
                <label className="formLabel">Custom Slug</label>
                <input
                  type="text"
                  placeholder="e.g. school/syllabus or code"
                  className="inputField"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="formGroup">
                <label className="formLabel">Destination URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/some/long/path"
                  className="inputField"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              {error && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "1.25rem", textAlign: "left" }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btnPrimary" disabled={submitting}>
                {submitting ? "Creating..." : "Create Short URL"}
              </button>
            </form>

            {successLink && (
              <div className="successBox" onClick={handleCopy}>
                <span className="successLink">{successLink}</span>
                <span className="successSubtext">
                  {copied ? "✓ Copied to clipboard!" : "Click to copy link"}
                </span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
