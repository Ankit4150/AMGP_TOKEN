import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.ADMIN.NOTIFICATIONS;

export const getNotificationApi = async (params = {}, signal) => {
  const res = await httpClient.get(URL.LIST, { params, signal });
  return res.data;
};

export const getNotificationByIdApi = async (id, signal) => {
  const res = await httpClient.get(URL.GET(id), { signal });
  return res.data;
};

export const createNotificationApi = async (data, signal) => {
  const res = await httpClient.post(URL.CREATE, data, { signal });
  return res.data;
};

export const updateNotificationApi = async (id, data, signal) => {
  const res = await httpClient.patch(URL.UPDATE(id), data, { signal });
  return res.data;
};

export const deleteNotificationApi = async (id, signal) => {
  const res = await httpClient.delete(URL.DELETE(id), { signal });
  return res.data;
};
