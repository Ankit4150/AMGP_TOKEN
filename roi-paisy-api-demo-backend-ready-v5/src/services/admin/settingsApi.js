import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.ADMIN.SETTINGS;

export const getSettingsApi = async (params = {}, signal) => {
  const res = await httpClient.get(URL.LIST, { params, signal });
  return res.data;
};

export const getSettingsByIdApi = async (id, signal) => {
  const res = await httpClient.get(URL.GET(id), { signal });
  return res.data;
};

export const createSettingsApi = async (data, signal) => {
  const res = await httpClient.post(URL.CREATE, data, { signal });
  return res.data;
};

export const updateSettingsApi = async (id, data, signal) => {
  const res = await httpClient.patch(URL.UPDATE(id), data, { signal });
  return res.data;
};

export const deleteSettingsApi = async (id, signal) => {
  const res = await httpClient.delete(URL.DELETE(id), { signal });
  return res.data;
};
