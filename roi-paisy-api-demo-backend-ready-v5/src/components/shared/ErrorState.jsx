import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

// Full-panel error with a retry button. Used when a page's first load fails.
export default function ErrorState({ title = "Couldn't load this page", message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-[#dce9f7] bg-white p-8 text-center shadow-sm dark:border-[#223250] dark:bg-[#101f38]"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
        <AlertCircle size={22} />
      </span>
      <div>
        <h2 className="m-0 text-base font-bold text-[#112f55] dark:text-white">{title}</h2>
        {message && <p className="mt-1 text-sm text-[#3e5d83] dark:text-[#90a5c4]">{message}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}
