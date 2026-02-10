import React, { useEffect, useMemo, useState } from "react";
import {
  getMyDevices,
  logoutAllDevices,
  logoutAllExceptCurrent,
  logoutOneDevice,
} from "../api/deviceApi";
import { getRefreshTokenId } from "../auth/authStorage";
import { parseDeviceName, timeAgo } from "../utils/deviceUtils";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 6;

  const currentRefreshTokenId = getRefreshTokenId();

  async function loadDevices() {
    try {
      setLoading(true);
      setError("");
      setMsg("");

      const data = await getMyDevices();
      setDevices(data);
    } catch (err) {
      setError(err.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
  }, []);

  async function handleLogoutOne(id, isCurrent) {
    if (isCurrent) {
      setMsg("");
      setError("You cannot logout the current device from here. Use Navbar Logout.");
      return;
    }

    if (!confirm("Logout this device session?")) return;

    try {
      setError("");
      setMsg("");

      await logoutOneDevice(id);
      setMsg("✅ Device logged out successfully");
      loadDevices();
    } catch (err) {
      setError(err.message || "Logout failed");
    }
  }

  async function handleLogoutAll() {
    if (!confirm("Logout from ALL devices?")) return;

    try {
      setError("");
      setMsg("");

      await logoutAllDevices();
      setMsg("✅ Logged out from all devices");
      loadDevices();
    } catch (err) {
      setError(err.message || "Logout all failed");
    }
  }

  async function handleLogoutAllExceptCurrent() {
    if (!currentRefreshTokenId) {
      setError("Current refresh token id not found. Please login again.");
      return;
    }

    if (!confirm("Logout from all devices EXCEPT this one?")) return;

    try {
      setError("");
      setMsg("");

      await logoutAllExceptCurrent(currentRefreshTokenId);
      setMsg("✅ Logged out from all other devices");
      loadDevices();
    } catch (err) {
      setError(err.message || "Logout failed");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const sorted = [...devices].sort((a, b) => {
      if (a.id === currentRefreshTokenId) return -1;
      if (b.id === currentRefreshTokenId) return 1;

      if (a.revoked !== b.revoked) return a.revoked ? 1 : -1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (!q) return sorted;

    return sorted.filter((d) => {
      const device = (d.device || "").toLowerCase();
      const ip = (d.ipAddress || "").toLowerCase();
      const id = String(d.id);

      return device.includes(q) || ip.includes(q) || id.includes(q);
    });
  }, [devices, search, currentRefreshTokenId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Manage Devices</h2>
          <p style={{ marginTop: 6, opacity: 0.7 }}>
            Active sessions are stored as refresh tokens in SQL Server.
          </p>
        </div>

        <div style={styles.headerRight}>
          <button style={styles.refreshBtn} onClick={loadDevices}>
            Refresh
          </button>

          <button style={styles.logoutAllWhiteBtn} onClick={handleLogoutAllExceptCurrent}>
            Logout Others
          </button>

          <button style={styles.logoutAllBtn} onClick={handleLogoutAll}>
            Logout All
          </button>
        </div>
      </div>

      <div style={styles.controls}>
        <input
          style={styles.search}
          placeholder="Search by device, IP, or session id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={{ opacity: 0.7, fontSize: 14 }}>
          Total: <b>{filtered.length}</b>
        </div>
      </div>

      {msg && <div style={styles.successBox}>{msg}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.card}>Loading devices...</div>
      ) : paged.length === 0 ? (
        <div style={styles.card}>No sessions found.</div>
      ) : (
        <>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Session</th>
                  <th>Device</th>
                  <th style={{ width: 140 }}>IP</th>
                  <th style={{ width: 160 }}>Created</th>
                  <th style={{ width: 140 }}>Last Used</th>
                  <th style={{ width: 170 }}>Status</th>
                  <th style={{ width: 130 }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {paged.map((d) => {
                  const isCurrent = d.id === currentRefreshTokenId;

                  return (
                    <tr key={d.id} style={isCurrent ? styles.currentRow : undefined}>
                      <td>
                        <div style={{ fontWeight: 900 }}>#{d.id}</div>
                        {isCurrent && <span style={styles.currentBadge}>This device</span>}
                      </td>

                      <td>
                        <div style={{ fontWeight: 900 }}>{parseDeviceName(d.device)}</div>
                        <div style={styles.uaText}>
                          {d.device ? d.device.slice(0, 90) : "Unknown user-agent"}
                          {d.device && d.device.length > 90 ? "..." : ""}
                        </div>
                      </td>

                      <td>{d.ipAddress || "Unknown"}</td>

                      <td>{d.createdAt ? new Date(d.createdAt).toLocaleString() : "-"}</td>

                      <td>
                        <div style={{ fontWeight: 800 }}>{timeAgo(d.lastUsedAt)}</div>
                        <div style={{ opacity: 0.6, fontSize: 12 }}>
                          {d.lastUsedAt ? new Date(d.lastUsedAt).toLocaleString() : "-"}
                        </div>
                      </td>

                      <td>
                        {d.revoked ? (
                          <span style={styles.revoked}>Revoked</span>
                        ) : (
                          <span style={styles.active}>Active</span>
                        )}

                        {d.reuseDetected && <span style={styles.reuse}>Reuse Detected</span>}
                      </td>

                      <td>
                        {!d.revoked ? (
                          <button
                            style={isCurrent ? styles.logoutBtnDisabled : styles.logoutBtn}
                            onClick={() => handleLogoutOne(d.id, isCurrent)}
                          >
                            Logout
                          </button>
                        ) : (
                          <span style={{ opacity: 0.6 }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <button
              style={styles.pageBtn}
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>

            <div style={{ fontWeight: 800 }}>
              Page {safePage} / {totalPages}
            </div>

            <button
              style={styles.pageBtn}
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </>
      )}

      <div style={{ marginTop: 14, opacity: 0.65, fontSize: 13 }}>
        Tip: Use <b>Logout Others</b> to keep only this device logged in.
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: "30px auto", padding: 18 },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },

  headerRight: { display: "flex", gap: 10, alignItems: "center" },

  controls: {
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },

  search: {
    flex: 1,
    minWidth: 260,
    maxWidth: 520,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ddd",
    fontSize: 15,
  },

  tableWrap: {
    marginTop: 18,
    overflowX: "auto",
    border: "1px solid #ddd",
    borderRadius: 16,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 980,
  },

  card: {
    marginTop: 18,
    padding: 18,
    borderRadius: 16,
    border: "1px solid #ddd",
    background: "#fafafa",
  },

  currentRow: {
    background: "#e8f3ff",
    borderLeft: "4px solid #3b82f6",
  },

  currentBadge: {
    display: "inline-block",
    marginTop: 6,
    padding: "4px 10px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
    border: "1px solid #8ab6ff",
    background: "#dbeaff",
  },

  uaText: {
    marginTop: 4,
    opacity: 0.65,
    fontSize: 12,
  },

  refreshBtn: {
    padding: "10px 14px",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 800,
  },

  logoutAllWhiteBtn: {
    padding: "10px 14px",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
  },

  logoutAllBtn: {
    padding: "10px 14px",
    border: "none",
    background: "black",
    color: "white",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
  },

  logoutBtn: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
  },

  logoutBtnDisabled: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    background: "#f3f3f3",
    borderRadius: 12,
    cursor: "not-allowed",
    fontWeight: 900,
    opacity: 0.6,
  },

  active: {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #a8f0b4",
    background: "#eaffee",
    fontWeight: 900,
    fontSize: 12,
  },

  revoked: {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #ffb4b4",
    background: "#ffecec",
    fontWeight: 900,
    fontSize: 12,
  },

  reuse: {
    marginLeft: 8,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #ffdf8a",
    background: "#fff7db",
    fontWeight: 900,
    fontSize: 12,
  },

  pagination: {
    marginTop: 14,
    display: "flex",
    justifyContent: "center",
    gap: 14,
    alignItems: "center",
  },

  pageBtn: {
    padding: "10px 14px",
    border: "1px solid #ddd",
    background: "white",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
  },

  errorBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #ffb4b4",
    background: "#ffecec",
  },

  successBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #a8f0b4",
    background: "#eaffee",
  },
};
