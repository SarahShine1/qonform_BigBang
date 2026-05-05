import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { loginUser } from "../../api/auth.api";

import qonformeLogo      from "../../assets/icons/qonforme-logo.svg";
import googleLogo        from "../../assets/icons/google-logo.svg";
import loginIllustration from "../../assets/images/login-illustration.svg";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; overflow: hidden; }
        body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; }
        input { font-family: inherit; }
        button { font-family: inherit; }
        input::placeholder { color: #ffffff; font-size: 14px; }
        input:focus { outline: none; }
        a { text-decoration: none; }
      `}</style>

      {/* ─── ROOT: full screen, two columns side by side ─────────── */}
      <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>

        {/* ══════════════════════════════════════════════════════════
            LEFT — grey background + logo top-left + illustration
        ══════════════════════════════════════════════════════════ */}
        <div style={{
          flex: 1,
          backgroundColor: "#eeeaf2",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}>
          {/* Logo top-left */}
          <div style={{
            position: "absolute",
            top: 24,
            left: 28,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <img src={qonformeLogo} alt="Qonforme" style={{ width: 30, height: 30 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Qonforme</span>
          </div>

          {/* Illustration */}
          <img
            src={loginIllustration}
            alt="Illustration"
            draggable={false}
            style={{
              width: "100%",
              maxWidth: 460,
              objectFit: "contain",
              userSelect: "none",
            }}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT — pure white, full height, scrollable, centered
        ══════════════════════════════════════════════════════════ */}
        <div style={{
          width: 520,
          flexShrink: 0,
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 48px",
          overflowY: "auto",
        }}>

          {/* ── Title ───────────────────────────────────────────── */}
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 18,
            lineHeight: 1.2,
          }}>
            Bienvenue sur
          </h1>

          {/* ── Brand pill ──────────────────────────────────────── */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            border: "1.5px solid #E5E7EB",
            borderRadius: 12,
            padding: "10px 18px 10px 14px",
            width: "fit-content",
            marginBottom: 22,
          }}>
            <img src={qonformeLogo} alt="" style={{ width: 26, height: 26 }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Qonforme</span>
          </div>

          {/* ── Google button ───────────────────────────────────── */}
          <button
            type="button"
            onClick={() => { /* TODO: window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/` */ }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              border: "1.5px solid #E5E7EB",
              borderRadius: 12,
              padding: "13px 16px",
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
              backgroundColor: "#fff",
              cursor: "pointer",
              marginBottom: 22,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#F9FAFB"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
          >
            <img src={googleLogo} alt="Google" style={{ width: 20, height: 20 }} />
            Se connecter avec Google
          </button>

          {/* ── OU divider ──────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
            <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.05em" }}>OU</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
          </div>

          {/* ── Form ────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Email field */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              backgroundColor: "#F3F3F6",
              borderRadius: 12,
              padding: "0 16px",
              height: 64,
            }}>
              {/* Envelope icon — solid black */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#111827" style={{ flexShrink: 0 }}>
                <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>

              {/* Label + input stacked */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  required
                  autoComplete="email"
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "#111827",
                    width: "100%",
                    padding: 0,
                    lineHeight: 1.4,
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              backgroundColor: "#F3F3F6",
              borderRadius: 12,
              padding: "0 16px",
              height: 64,
            }}>
              {/* Key icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#111827" style={{ flexShrink: 0 }}>
                <path d="M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>

              {/* Label + input stacked */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "#111827",
                    width: "100%",
                    padding: 0,
                    lineHeight: 1.4,
                  }}
                />
              </div>

              {/* Eye toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Masquer" : "Afficher"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#9CA3AF",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75C21.27 7.61 17 4.5 12 4.5c-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zm7.53 5.53 1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* API error */}
            {error && (
              <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{error}</p>
            )}

            {/* Remember me + Forgot password */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "4px 0",
            }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#4B5563",
                cursor: "pointer",
                userSelect: "none",
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: "#6B21A8" }}
                />
                Se souvenir de moi
              </label>
              <Link
                to="/forgot-password"
                style={{ fontSize: 13, color: "#6B21A8", fontWeight: 500 }}
              >
                Mot de passe oublié?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                backgroundColor: "#5B1FA8",
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
                padding: "15px 0",
                borderRadius: 12,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
                letterSpacing: "0.01em",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = "#4A1890"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = "#5B1FA8"; }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

         
        </div>{/* end white panel */}
      </div>{/* end root flex */}
    </>
  );
}