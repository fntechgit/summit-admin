export const sortByOrder = (a, b) => {
  const getOrderValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return Number.MAX_SAFE_INTEGER;
    }

    const numericOrder = Number(value);
    return Number.isFinite(numericOrder)
      ? numericOrder
      : Number.MAX_SAFE_INTEGER;
  };

  const leftOrder = getOrderValue(a?.order);
  const rightOrder = getOrderValue(b?.order);

  return leftOrder - rightOrder;
};

const EMPTY_DDL = [];
const ddlCache = new WeakMap();

export const buildNameIdDDL = (items) => {
  if (!Array.isArray(items)) return EMPTY_DDL;

  const cached = ddlCache.get(items);
  if (cached) return cached;

  const result = items
    .filter(
      (item) =>
        item?.id !== undefined &&
        item?.id !== null &&
        typeof item?.name === "string" &&
        item.name.trim().length > 0
    )
    .sort(sortByOrder)
    .map((item) => ({ label: item.name, value: item.id }));

  ddlCache.set(items, result);
  return result;
};
