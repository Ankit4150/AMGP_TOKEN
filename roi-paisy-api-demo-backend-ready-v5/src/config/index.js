const apiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.NEXT_PUBLIC_API_URL ||
  "demo";

// Demo mode is selected by the URL itself. This keeps backend integration simple:
// change only VITE_API_URL from "demo" to the real backend base URL.
const explicitDataSource = import.meta.env.VITE_DATA_SOURCE;
const isDemo = explicitDataSource
  ? explicitDataSource === "demo"
  : apiUrl === "demo";

export const CONFIG = {
  API_URL: apiUrl,
  DATA_SOURCE: isDemo ? "demo" : "api",
  USE_MOCK_API: isDemo,
};
