import { httpClient } from "../httpClient";
import { ENDPOINTS } from "../endpoints";

const URL = ENDPOINTS.USER.NOTIFICATIONS;

export const getUserNotificationApi = async (params = {}, signal) => {
  const res = await httpClient.get(URL.LIST, { params, signal });
  return res.data;
};
export const getUserNotificationByIdApi = async (id, signal) => {
  const res = await httpClient.get(URL.GET(id), { signal });
  return res.data;
};
export const markReadUserNotificationApi = async (id, signal) => {
  const res = await httpClient.patch(
    URL.MARK_READ(id),
    { action: "mark_read" },
    { signal },
  );
  return res.data;
};
export const markAllReadUserNotificationApi = async (signal) => {
  const res = await httpClient.patch(
    URL.MARK_ALL_READ,
    { action: "mark_all_read" },
    { signal },
  );
  return res.data;
};
