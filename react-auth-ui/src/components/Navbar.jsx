import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div style={styles.nav}>
      <h3 style={{ margin: 0 }}>React Auth</h3>

      <div style={styles.links}>
        <Link to="/">Dashboard</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/devices">Devices</Link>

        {!isAuthenticated ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        ) : (
          <>
            <span style={{ opacity: 0.8 }}>
              {user?.email} ({user?.role})
            </span>
            <button onClick={handleLogout} style={styles.btn}>
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  nav: {
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #ddd",
    position: "sticky",
    top: 0,
    background: "white",
  },
  links: { display: "flex", gap: 14, alignItems: "center" },
  btn: {
    padding: "8px 14px",
    border: "none",
    background: "black",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
  },
};
