export const OPERATORS = {
  IS: { value: "==", label: "is" },
  LIKE: { value: "=@", label: "like" },
  LIKE_START: { value: "@@", label: "like start" },
  IS_NOT: { value: "<>", label: "is not" },
  HAS: { value: ">>", label: "has" },
  HAS_NOT: { value: "!>>", label: "has not" },
  LESS: { value: "<", label: "less than" },
  LESS_OR_EQUAL: { value: "<=", label: "less than or equal to" },
  GREATER: { value: ">", label: "greater than" },
  GREATER_OR_EQUAL: { value: ">=", label: "greater than or equal to" },
  BETWEEN: { value: "[]", label: "between" },
  BETWEEN_STRICT: { value: "()", label: "between strict" }
};

export const JOIN_OPERATORS = { ALL: "all", ANY: "any" };
