import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.ADMIN.KYC;

export const getKycApi = async (params = {}, signal) => {
  const res = await httpClient.get(URL.LIST, { params, signal });
  return res.data;
};

export const getKycByIdApi = async (id, signal) => {
  const res = await httpClient.get(URL.GET(id), { signal });
  return res.data;
};

export const createKycApi = async (data, signal) => {
  const res = await httpClient.post(URL.CREATE, data, { signal });
  return res.data;
};

export const updateKycApi = async (id, data, signal) => {
  const res = await httpClient.patch(URL.UPDATE(id), data, { signal });
  return res.data;
};

export const deleteKycApi = async (id, signal) => {
  const res = await httpClient.delete(URL.DELETE(id), { signal });
  return res.data;
};
