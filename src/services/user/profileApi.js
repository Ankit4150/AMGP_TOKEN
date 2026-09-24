import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.USER.PROFILE;

export const getProfileApi = async (signal) => {
  const res = await httpClient.get(URL.GET, { signal });
  return res.data;
};
export const updateProfileApi = async (data, signal) => {
  const res = await httpClient.patch(URL.UPDATE, data, { signal });
  return res.data;
};
