const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

// Formats a DOLLAR amount (number or numeric string) as "$1,234.56".
// Non-numeric / null → em dash.
export const formatUsd = (value) => {
  // Blank / whitespace-only strings are missing values, not zero
  // (Number("") === 0 would otherwise render "$0.00").
  if (typeof value === "string" && value.trim() === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n) || !Number.isFinite(n))
    return "—";
  return USD.format(n);
};

export default formatUsd;
