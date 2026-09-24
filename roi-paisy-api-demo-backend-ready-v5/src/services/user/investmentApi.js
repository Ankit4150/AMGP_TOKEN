import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.USER.INVESTMENTS;

export const getUserInvestmentApi = async (params = {}, signal) => {
  const res = await httpClient.get(URL.LIST, { params, signal });
  return res.data;
};
export const getUserInvestmentByIdApi = async (id, signal) => {
  const res = await httpClient.get(URL.GET(id), { signal });
  return res.data;
};
export const createUserInvestmentApi = async (data, signal) => {
  const res = await httpClient.post(URL.CREATE, data, { signal });
  return res.data;
};
export const updateUserInvestmentApi = async (id, data, signal) => {
  const res = await httpClient.patch(URL.UPDATE(id), data, { signal });
  return res.data;
};
export const packagesUserInvestmentApi = async (params = {}, signal) => {
  const res = await httpClient.get(ENDPOINTS.USER.INVESTMENT_PACKAGES.LIST, {
    params,
    signal,
  });
  return res.data;
};
