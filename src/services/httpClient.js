import axios from "axios";
import { CONFIG } from "../config";
import { mockRequest } from "../mock/mockDatabase";

const axiosClient = axios.create({
  baseURL: CONFIG.USE_MOCK_API ? undefined : CONFIG.API_URL,
  timeout: 30_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const demoResponse = async (method, url, config = {}) => {
  if (config.signal?.aborted) {
    throw new DOMException("Request aborted", "AbortError");
  }

  const data = await mockRequest({
    method,
    url: String(url || ""),
    data: config.data,
    params: config.params,
    signal: config.signal,
  });

  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
};

export const httpClient = {
  get: (url, config = {}) =>
    CONFIG.USE_MOCK_API
      ? demoResponse("get", url, config)
      : axiosClient.get(url, config),

  post: (url, data, config = {}) =>
    CONFIG.USE_MOCK_API
      ? demoResponse("post", url, { ...config, data })
      : axiosClient.post(url, data, config),

  put: (url, data, config = {}) =>
    CONFIG.USE_MOCK_API
      ? demoResponse("put", url, { ...config, data })
      : axiosClient.put(url, data, config),

  patch: (url, data, config = {}) =>
    CONFIG.USE_MOCK_API
      ? demoResponse("patch", url, { ...config, data })
      : axiosClient.patch(url, data, config),

  delete: (url, config = {}) =>
    CONFIG.USE_MOCK_API
      ? demoResponse("delete", url, config)
      : axiosClient.delete(url, config),

  request: (config = {}) =>
    CONFIG.USE_MOCK_API
      ? demoResponse(config.method || "get", config.url, config)
      : axiosClient.request(config),
};

export default httpClient;
