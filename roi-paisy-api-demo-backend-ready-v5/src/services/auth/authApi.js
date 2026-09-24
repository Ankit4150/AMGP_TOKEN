import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

export const loginApi = async (data, signal) => {
  const res = await httpClient.post(ENDPOINTS.AUTH.LOGIN, data, { signal });
  return res.data;
};
export const getMeApi = async (signal) => {
  const res = await httpClient.get(ENDPOINTS.AUTH.ME, { signal });
  return res.data;
};
export const logoutApi = async (signal) => {
  const res = await httpClient.post(ENDPOINTS.AUTH.LOGOUT, undefined, {
    signal,
  });
  return res.data;
};
export const registerApi = async (data, signal) => {
  const res = await httpClient.post(ENDPOINTS.AUTH.REGISTER, data, { signal });
  return res.data;
};
export const verifyOtpApi = async (data, signal) => {
  const res = await httpClient.post(ENDPOINTS.AUTH.VERIFY_OTP, data, {
    signal,
  });
  return res.data;
};
export const forgotPasswordApi = async (data, signal) => {
  const res = await httpClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data, {
    signal,
  });
  return res.data;
};
export const resetPasswordApi = async (data, signal) => {
  const res = await httpClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, data, {
    signal,
  });
  return res.data;
};
