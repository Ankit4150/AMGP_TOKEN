// Display helpers for the user panel.
// The API may send numbers or decimal strings ("2,450.00"), so everything goes
// through toNumber() first. Money is only *displayed* here - all calculations
// (profit, token conversion, estimated value) are done by the backend.

export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

const formatter = (min, max) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: min, maximumFractionDigits: max });

const plain = formatter(0, 4);
const usdt = formatter(0, 2);
const price = formatter(2, 4);
const percent = formatter(2, 2);

export const formatTokenAmount = (value, symbol = "") =>
  `${plain.format(toNumber(value))}${symbol ? ` ${symbol}` : ""}`;

export const formatUsdt = (value) => `${usdt.format(toNumber(value))} USDT`;

export const formatPrice = (value) => `${price.format(toNumber(value))} USDT`;

export const formatPercent = (value) => `${percent.format(toNumber(value))}%`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-09-19" -> "19 Sep 2026"
export function formatDate(value) {
  if (!value) return "";
  const date = new Date(String(value).length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
