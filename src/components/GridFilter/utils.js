import T from "i18n-react/dist/i18n-react";

export const OPERATORS = {
  IS: { value: "==", label: T.translate("grid_filter.operators.is") },
  IS_NOT: { value: "<>", label: T.translate("grid_filter.operators.is_not") },
  LIKE: { value: "=@", label: T.translate("grid_filter.operators.like") },
  LIKE_START: {
    value: "@@",
    label: T.translate("grid_filter.operators.like_start")
  },
  HAS: { value: ">>", label: T.translate("grid_filter.operators.has") }, // not available on API
  HAS_NOT: {
    value: "!>>",
    label: T.translate("grid_filter.operators.has_not")
  }, // not available on API
  LESS: { value: "<", label: T.translate("grid_filter.operators.less") },
  LESS_OR_EQUAL: {
    value: "<=",
    label: T.translate("grid_filter.operators.less_or_equal")
  },
  GREATER: { value: ">", label: T.translate("grid_filter.operators.greater") },
  GREATER_OR_EQUAL: {
    value: ">=",
    label: T.translate("grid_filter.operators.greater_or_equal")
  },
  BETWEEN: { value: "[]", label: T.translate("grid_filter.operators.between") },
  BETWEEN_STRICT: {
    value: "()",
    label: T.translate("grid_filter.operators.between_strict")
  }
};

export const JOIN_OPERATORS = {
  ALL: T.translate("grid_filter.operators.all"),
  ANY: T.translate("grid_filter.operators.any")
};
