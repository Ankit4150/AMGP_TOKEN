import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.USER.DEPOSITS;

export const getDepositApi = async (params = {}, signal) => {
  const res = await httpClient.get(URL.LIST, { params, signal });
  return res.data;
};
export const getDepositByIdApi = async (id, signal) => {
  const res = await httpClient.get(URL.GET(id), { signal });
  return res.data;
};
export const createDepositApi = async (data, signal) => {
  const res = await httpClient.post(URL.CREATE, data, { signal });
  return res.data;
};
export const updateDepositApi = async (id, data, signal) => {
  const res = await httpClient.patch(URL.UPDATE(id), data, { signal });
  return res.data;
};
