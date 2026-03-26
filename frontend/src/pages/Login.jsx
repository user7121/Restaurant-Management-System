import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("AdminPass123!");
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form
        onSubmit={handleSubmit}
        style={{ width: 360, background: "#fff", padding: 20, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      >
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: 14 }}>
          Test account: <code>admin</code> / <code>AdminPass123!</code>
        </p>

        <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 14 }}
        />

        <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          style={{ width: "100%", padding: 10, marginBottom: 14 }}
        />

        {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10, background: "#2563eb", color: "#fff", border: 0, borderRadius: 6, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;

