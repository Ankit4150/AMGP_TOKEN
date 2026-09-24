import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.ADMIN.BUYBACKS;

export const getBuybackApi = async (params = {}, signal) => {
  const res = await httpClient.get(URL.LIST, { params, signal });
  return res.data;
};

export const getBuybackByIdApi = async (id, signal) => {
  const res = await httpClient.get(URL.GET(id), { signal });
  return res.data;
};

export const createBuybackApi = async (data, signal) => {
  const res = await httpClient.post(URL.CREATE, data, { signal });
  return res.data;
};

export const updateBuybackApi = async (id, data, signal) => {
  const res = await httpClient.patch(URL.UPDATE(id), data, { signal });
  return res.data;
};

export const deleteBuybackApi = async (id, signal) => {
  const res = await httpClient.delete(URL.DELETE(id), { signal });
  return res.data;
};
