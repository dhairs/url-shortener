import Head from "next/head";
import { useState, useEffect } from "react";

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

  // Link tracking states
  const [links, setLinks] = useState<any[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Search & Edit states
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch all links
  const fetchLinks = async () => {
    setLoadingLinks(true);
    try {
      const res = await fetch("/api/list");
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" && data.links) {
          setLinks(data.links);
        }
      }
    } catch (err) {
      console.error("Failed to fetch links:", err);
    } finally {
      setLoadingLinks(false);
    }
  };

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

  // Fetch links when authorized
  useEffect(() => {
    if (isAuthorized) {
      fetchLinks();
    }
  }, [isAuthorized]);

  const handleSignIn = () => {
    setError(null);
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "https://auth.guptadhairya.com";
    const currentUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
    window.location.href = `${authUrl}/?redirect=${encodeURIComponent(currentUrl)}`;
  };

  const handleSignOut = () => {
    setError(null);
    setCheckingAuth(true);
    setSuccessLink(null);
    
    // Clear local shortener session cookie first
    fetch("/api/auth/session", { method: "DELETE" })
      .catch((err) => console.warn("Failed to clear local session:", err))
      .finally(() => {
        // Redirect to auth portal to sign out of the main Google session globally,
        // which then bounces back here unauthenticated.
        const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "https://auth.guptadhairya.com";
        const currentUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
        window.location.href = `${authUrl}/?action=logout&redirect=${encodeURIComponent(currentUrl)}`;
      });
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
      fetchLinks(); // Refresh links dashboard
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

  const handleCopySlug = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleSaveEdit = async (slug: string) => {
    if (!editingUrl) {
      setEditError("Destination URL is required.");
      return;
    }
    if (!editingUrl.startsWith("http://") && !editingUrl.startsWith("https://")) {
      setEditError("URL must start with http:// or https://");
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, url: editingUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update redirect URL");
      }

      setEditingSlug(null);
      setEditingUrl("");
      fetchLinks(); // Refresh links dashboard
    } catch (err: any) {
      setEditError(err.message || "An unexpected error occurred.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter links on search term
  const filteredLinks = links.filter((link) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      link.slug.toLowerCase().includes(term) ||
      link.url.toLowerCase().includes(term)
    );
  });

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

            <button onClick={handleSignIn} className="btnPrimary" style={{ marginTop: 0 }}>
              Log In
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

            {/* links list container */}
            <div className="linksContainer">
              <div className="linksHeader">
                <span>Active Redirects</span>
                {loadingLinks && <span style={{ fontSize: "0.7rem", color: "#f3ddb6" }}>syncing...</span>}
              </div>

              {links.length > 0 && (
                <div className="searchContainer">
                  <input
                    type="text"
                    placeholder="Search active redirects by slug or URL..."
                    className="searchInput"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}

              {filteredLinks.length === 0 ? (
                <div className="noLinks">
                  {loadingLinks 
                    ? "Syncing database..." 
                    : links.length === 0 
                      ? "No shortened URLs configured." 
                      : "No matching redirects found."}
                </div>
              ) : (
                filteredLinks.map((link) => {
                  const isEditing = editingSlug === link.slug;
                  return (
                    <div key={link.slug} className="linkRow">
                      <div className="linkInfo">
                        <a
                          href={`/${link.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="linkSlug"
                        >
                          /{link.slug}
                        </a>
                        {isEditing ? (
                          <div style={{ width: "100%", marginTop: "0.25rem" }}>
                            <input
                              type="url"
                              className="linkDestInput"
                              value={editingUrl}
                              onChange={(e) => setEditingUrl(e.target.value)}
                              disabled={savingEdit}
                              required
                            />
                            {editError && editingSlug === link.slug && (
                              <div style={{ color: "#ef4444", fontSize: "0.7rem", marginTop: "0.25rem" }}>
                                {editError}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="linkDest" title={link.url}>
                            {link.url}
                          </span>
                        )}
                      </div>
                      <div className="linkMeta">
                        <span className="linkCount">
                          {link.count} {link.count === 1 ? "click" : "clicks"}
                        </span>
                        
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(link.slug)}
                              className="btnCopyMini"
                              style={{ borderColor: "#f3ddb6", color: "#f3ddb6" }}
                              disabled={savingEdit}
                            >
                              {savingEdit ? "Saving" : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingSlug(null);
                                setEditingUrl("");
                                setEditError(null);
                              }}
                              className="btnCopyMini"
                              style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "#ef4444" }}
                              disabled={savingEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingSlug(link.slug);
                                setEditingUrl(link.url);
                                setEditError(null);
                              }}
                              className="btnCopyMini"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCopySlug(link.slug)}
                              className="btnCopyMini"
                            >
                              {copiedSlug === link.slug ? "Copied" : "Copy"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
