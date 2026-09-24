import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.USER.ROI;

export const getUserRoiApi = async (params = {}, signal) => {
  const res = await httpClient.get(URL.LIST, { params, signal });
  return res.data;
};
export const getUserRoiByIdApi = async (id, signal) => {
  const res = await httpClient.get(URL.GET(id), { signal });
  return res.data;
};
