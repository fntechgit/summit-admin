export const normalizeTiers = (arr) => {
  if (!Array.isArray(arr)) return [];
  return typeof arr[0] === "object" ? arr.map((t) => t.id) : arr;
};

export const sameTierSet = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((v) => setB.has(v));
};
