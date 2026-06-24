const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

// Formats a DOLLAR amount (number or numeric string) as "$1,234.56".
// Non-numeric / null → em dash.
export const formatUsd = (value) => {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return USD.format(n);
};

export default formatUsd;
