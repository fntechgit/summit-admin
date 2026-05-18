import { validateAllowedEmailDomainEntry } from "../../../../../utils/methods";

export const LARGE_DOMAIN_LIST_THRESHOLD = 50;

const PASTE_SEPARATORS = /[\n,\t;]+/;

export const parseTextBlob = (raw) => {
  if (typeof raw !== "string") return [];
  return raw
    .split(PASTE_SEPARATORS)
    .map((s, idx) => ({ entry: s.trim(), sourceRow: idx + 1 }))
    .filter((r) => r.entry.length > 0);
};

const BARE_DOMAIN_RE =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

export const normalizeEntry = (raw) => {
  const trimmed = (raw ?? "").trim();
  if (trimmed.length === 0) {
    return { normalized: "", dedupKey: "", autoPrefixed: false };
  }
  if (!trimmed.includes("@") && BARE_DOMAIN_RE.test(trimmed)) {
    const normalized = `@${trimmed}`;
    return {
      normalized,
      dedupKey: normalized.toLowerCase(),
      autoPrefixed: true
    };
  }
  return {
    normalized: trimmed,
    dedupKey: trimmed.toLowerCase(),
    autoPrefixed: false
  };
};

export const classifyEntries = ({ raw, existing }) => {
  const existingKeys = new Set(
    (existing ?? []).map((e) => String(e).toLowerCase())
  );
  const seenInInput = new Set();
  const result = {
    valid: [],
    invalid: [],
    dupExisting: [],
    dupInput: [],
    autoPrefixed: []
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const row of raw ?? []) {
    const { normalized, dedupKey, autoPrefixed } = normalizeEntry(row.entry);
    if (normalized.length === 0) continue;

    if (!validateAllowedEmailDomainEntry(normalized)) {
      result.invalid.push({ ...row, normalized });
      continue;
    }
    if (existingKeys.has(dedupKey)) {
      if (!seenInInput.has(dedupKey)) {
        result.dupExisting.push({ ...row, normalized });
        seenInInput.add(dedupKey);
      } else {
        result.dupInput.push({ ...row, normalized });
      }
      continue;
    }
    if (seenInInput.has(dedupKey)) {
      result.dupInput.push({ ...row, normalized });
      continue;
    }
    seenInInput.add(dedupKey);
    result.valid.push({ ...row, normalized });
    if (autoPrefixed) result.autoPrefixed.push({ ...row, normalized });
  }

  return result;
};
