import axiosClient from "./axiosClient";

export async function getMyDevices() {
  const res = await axiosClient.get("/api/auth/devices");
  return res.data;
}

export async function logoutOneDevice(refreshTokenId) {
  const res = await axiosClient.post(`/api/auth/devices/logout-one/${refreshTokenId}`);
  return res.data;
}

export async function logoutAllDevices() {
  const res = await axiosClient.post("/api/auth/devices/logout-all");
  return res.data;
}

export async function logoutAllExceptCurrent(currentRefreshTokenId) {
  const res = await axiosClient.post(
    "/api/auth/devices/logout-all-except-current",
    { currentRefreshTokenId }
  );
  return res.data;
}
