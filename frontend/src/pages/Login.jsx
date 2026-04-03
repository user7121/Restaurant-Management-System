import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  // Ensure the input fields are empty by default
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setError(data?.message || "Login failed.");
        return;
      }

      // Backend response: { success, data: { token, user } }
      localStorage.setItem("token", data.data.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "var(--font-family)" }}>
      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up"
        style={{ width: "380px", background: "var(--surface-900)", padding: "32px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.4)", border: "1px solid var(--surface-800)" }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, var(--primary-500), var(--purple-500))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto 12px" }}>
            🍽️
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: "800", color: "var(--surface-50)", letterSpacing: "-0.5px" }}>Restaurant Management System</h2>
          <p style={{ margin: 0, color: "var(--surface-400)", fontSize: "14px" }}>Sign in to access your dashboard</p>
        </div>

        <div style={{ marginBottom: "20px", padding: "12px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", color: "var(--primary-300)", fontSize: "13px", lineHeight: "1.5" }}>
          <strong>Test account:</strong><br />
          <code style={{ background: "rgba(0,0,0,0.2)", padding: "2px 6px", borderRadius: "4px", color: "var(--primary-200)" }}>admin</code> / <code style={{ background: "rgba(0,0,0,0.2)", padding: "2px 6px", borderRadius: "4px", color: "var(--primary-200)" }}>AdminPass123!</code>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "var(--surface-300)" }}>Username</label>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{ width: "100%", padding: "12px 14px", background: "var(--surface-800)", border: "1.5px solid var(--surface-700)", borderRadius: "10px", color: "var(--surface-100)", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.2s", fontFamily: "var(--font-family)" }}
              onFocus={e=>{e.target.style.borderColor="var(--primary-500)"; e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,0.15)";}}
              onBlur={e=>{e.target.style.borderColor="var(--surface-700)"; e.target.style.boxShadow="none";}}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "var(--surface-300)" }}>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              style={{ width: "100%", padding: "12px 14px", background: "var(--surface-800)", border: "1.5px solid var(--surface-700)", borderRadius: "10px", color: "var(--surface-100)", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.2s", fontFamily: "var(--font-family)" }}
              onFocus={e=>{e.target.style.borderColor="var(--primary-500)"; e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,0.15)";}}
              onBlur={e=>{e.target.style.borderColor="var(--surface-700)"; e.target.style.boxShadow="none";}}
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", color: "var(--danger-400)", fontSize: "13px", fontWeight: "500", marginBottom: "20px", textAlign: "center" }}>
            ⚠ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !username || !password}
          style={{ width: "100%", padding: "12px", background: (loading || !username || !password) ? "var(--primary-800)" : "var(--primary-600)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: (loading || !username || !password) ? "not-allowed" : "pointer", transition: "all 0.2s", boxShadow: (loading || !username || !password) ? "none" : "0 4px 14px rgba(99,102,241,0.3)" }}
          onMouseEnter={e=>{ if(!loading && username && password) { e.currentTarget.style.background="var(--primary-500)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(99,102,241,0.45)"; } }}
          onMouseLeave={e=>{ if(!loading && username && password) { e.currentTarget.style.background="var(--primary-600)"; e.currentTarget.style.boxShadow="0 4px 14px rgba(99,102,241,0.3)"; } }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
