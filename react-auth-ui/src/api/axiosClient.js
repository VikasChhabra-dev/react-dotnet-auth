import axios from "axios";
import { getAccessToken, getRefreshToken, saveAuth, clearAuth } from "../auth/authStorage";
import { refreshToken as refreshApi } from "./authApi";

const API_BASE_URL = "https://localhost:7065";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = getRefreshToken();
        if (!refresh) throw new Error("No refresh token");

        const newAuth = await refreshApi({ refreshToken: refresh });

        saveAuth(
          newAuth.accessToken,
          newAuth.refreshToken,
          newAuth.refreshTokenId,
          newAuth.user
        );

        originalRequest.headers.Authorization = `Bearer ${newAuth.accessToken}`;
        return axiosClient(originalRequest);
      } catch (err) {
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
