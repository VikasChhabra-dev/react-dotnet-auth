import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import axiosClient from "../api/axiosClient";

export default function Dashboard() {
  const { user } = useAuth();

  const [apiMessage, setApiMessage] = useState("");
  const [error, setError] = useState("");

  async function callSecureApi() {
    setError("");
    setApiMessage("");

    try {
      const res = await axiosClient.get("/api/test/secure");
      setApiMessage(`${res.data.message} | ${res.data.time}`);
    } catch (err) {
      setError(err.message || "Secure API failed");
    }
  }

  return (
    <div style={styles.container}>
      <h2>Dashboard (Protected)</h2>
      <p>✅ You are logged in successfully.</p>

      <div style={styles.box}>
        <div><b>ID:</b> {user?.id}</div>
        <div><b>Name:</b> {user?.name}</div>
        <div><b>Email:</b> {user?.email}</div>
        <div><b>Role:</b> {user?.role}</div>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h3>Secure API Test (Axios Auto Refresh)</h3>
      <p style={{ opacity: 0.7 }}>
        Click button to call a protected API. If token expired, Axios will refresh automatically.
      </p>

      <button style={styles.btn} onClick={callSecureApi}>
        Call Secure API
      </button>

      {apiMessage && <div style={styles.successBox}>{apiMessage}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}
    </div>
  );
}

const styles = {
  container: { maxWidth: 800, margin: "30px auto", padding: 18 },
  box: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fafafa",
    width: "fit-content",
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
    marginTop: 10,
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ffb4b4",
    background: "#ffecec",
  },
  successBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #a8f0b4",
    background: "#eaffee",
  },
};
