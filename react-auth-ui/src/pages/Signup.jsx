import React, { useState } from "react";
import { registerUser } from "../api/authApi";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setError("");

    if (name.trim().length < 2) return setError("Name must be at least 2 chars");
    if (!email.includes("@")) return setError("Enter a valid email");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    try {
      setLoading(true);

      await registerUser({ name, email, password });

      setMsg("✅ Signup successful! Now login.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h2>Create Account</h2>
      <p style={{ opacity: 0.7, marginTop: 6 }}>
        Register with Email + Password (stored in SQL Server)
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Password (min 6 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.btn} disabled={loading}>
          {loading ? "Creating..." : "Signup"}
        </button>

        {error && <div style={styles.errorBox}>{error}</div>}
        {msg && <div style={styles.successBox}>{msg}</div>}
      </form>

      <p style={{ marginTop: 14 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 440,
    margin: "40px auto",
    padding: 18,
    border: "1px solid #ddd",
    borderRadius: 14,
  },
  form: { display: "grid", gap: 12, marginTop: 14 },
  input: {
    padding: 10,
    fontSize: 16,
    borderRadius: 10,
    border: "1px solid #ccc",
  },
  btn: {
    padding: 12,
    fontSize: 16,
    background: "black",
    color: "white",
    cursor: "pointer",
    borderRadius: 10,
    border: "none",
    fontWeight: 800,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ffb4b4",
    background: "#ffecec",
  },
  successBox: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #a8f0b4",
    background: "#eaffee",
  },
};
