import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { facebookLogin, googleLogin, loginUser } from "../api/authApi";

import { GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

const FACEBOOK_APP_ID = "1468896701911393";

export default function Login() {
  const { setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/";

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await loginUser({ email, password });
      setSession(res);

      navigate(redirectTo);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <p style={{ opacity: 0.7, marginTop: 6 }}>
        Login with Email/Password OR Social Login
      </p>

      <div style={{ marginTop: 14 }}>
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              setLoading(true);
              setError("");

              const idToken = credentialResponse.credential;

              const res = await googleLogin({ idToken });
              setSession(res);

              navigate("/");
            } catch (err) {
              setError(err.message || "Google login failed");
            } finally {
              setLoading(false);
            }
          }}
          onError={() => setError("Google login failed")}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <FacebookLogin
          appId={FACEBOOK_APP_ID}
          callback={async (response) => {
            try {
              setLoading(true);
              setError("");

              if (!response.accessToken) {
                setError("Facebook login failed");
                return;
              }

              const res = await facebookLogin({ accessToken: response.accessToken });

              setSession(res);
              navigate("/");
            } catch (err) {
              setError(err.message || "Facebook login failed");
            } finally {
              setLoading(false);
            }
          }}
          render={(renderProps) => (
            <button style={styles.fbBtn} onClick={renderProps.onClick} disabled={loading}>
              Continue with Facebook
            </button>
          )}
        />
      </div>

      <div style={styles.divider}>OR</div>

      <form onSubmit={handleLogin} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.btn} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && <div style={styles.errorBox}>{error}</div>}
      </form>

      <p style={{ marginTop: 14 }}>
        Don’t have an account? <Link to="/signup">Signup</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 460,
    margin: "40px auto",
    padding: 18,
    border: "1px solid #ddd",
    borderRadius: 14,
  },
  fbBtn: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
  },
  divider: { textAlign: "center", opacity: 0.6, margin: "16px 0" },
  form: { display: "grid", gap: 12 },
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
};
