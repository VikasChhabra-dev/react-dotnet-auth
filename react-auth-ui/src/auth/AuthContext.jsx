import React, { createContext, useContext, useEffect, useState } from "react";
import { clearAuth, getAccessToken, getRefreshToken, getUser, saveAuth } from "./authStorage";
import { logoutApi } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const a = getAccessToken();
    const r = getRefreshToken();
    const u = getUser();

    if (a && r && u) {
      setAccessToken(a);
      setRefreshToken(r);
      setUser(u);
    }
  }, []);

  const isAuthenticated = !!accessToken;

  function setSession(authResponse) {
    saveAuth(
      authResponse.accessToken,
      authResponse.refreshToken,
      authResponse.refreshTokenId,
      authResponse.user
    );

    setAccessToken(authResponse.accessToken);
    setRefreshToken(authResponse.refreshToken);
    setUser(authResponse.user);
  }

  async function logout() {
    try {
      const r = getRefreshToken();
      if (r) await logoutApi({ refreshToken: r });
    } catch {}

    clearAuth();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        user,
        isAuthenticated,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
