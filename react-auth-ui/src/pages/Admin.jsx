import React from "react";
import { useAuth } from "../auth/AuthContext";

export default function Admin() {
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      <h2>Admin Page (Role Protected)</h2>
      <p>
        Only users with role = <b>admin</b> can access this page.
      </p>

      <div style={styles.box}>
        Logged in as: <b>{user?.email}</b>
      </div>
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
};
