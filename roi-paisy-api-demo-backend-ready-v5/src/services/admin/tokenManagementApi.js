import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.ADMIN.TOKENS;

export const getTokenManagementApi = async (params = {}, signal) => {
  const res = await httpClient.get(URL.LIST, { params, signal });
  return res.data;
};

export const getTokenManagementByIdApi = async (id, signal) => {
  const res = await httpClient.get(URL.GET(id), { signal });
  return res.data;
};

export const createTokenManagementApi = async (data, signal) => {
  const res = await httpClient.post(URL.CREATE, data, { signal });
  return res.data;
};

export const updateTokenManagementApi = async (id, data, signal) => {
  const res = await httpClient.patch(URL.UPDATE(id), data, { signal });
  return res.data;
};

export const deleteTokenManagementApi = async (id, signal) => {
  const res = await httpClient.delete(URL.DELETE(id), { signal });
  return res.data;
};
