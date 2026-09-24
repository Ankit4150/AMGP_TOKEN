import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.USER.SECURITY;

export const getSecuritySettingsApi = async (signal) => {
  const res = await httpClient.get(URL.SETTINGS, { signal });
  return res.data;
};
export const updateSecuritySettingsApi = async (data, signal) => {
  const res = await httpClient.patch(URL.SETTINGS, data, { signal });
  return res.data;
};
export const changePasswordSecurityApi = async (data, signal) => {
  const res = await httpClient.post(URL.PASSWORD, data, { signal });
  return res.data;
};
export const changeSecurityPasswordApi = changePasswordSecurityApi;
export const getSecuritySessionsApi = async (signal) => {
  const res = await httpClient.get(URL.SESSIONS, { signal });
  return res.data;
};
export const revokeSecuritySessionApi = async (id, signal) => {
  const res = await httpClient.delete(URL.SESSION(id), { signal });
  return res.data;
};
export const getSecurityActivityApi = async (params = {}, signal) => {
  const res = await httpClient.get(URL.ACTIVITY, { params, signal });
  return res.data;
};
