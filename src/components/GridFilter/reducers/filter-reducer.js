import { SAVE_FILTERS } from "../actions/filter-actions";
import { JOIN_OPERATORS } from "../utils";

const INITIAL_STATE = {
  id: null,
  joinOperator: JOIN_OPERATORS.ALL,
  filterValues: [],
  parsedFilter: []
};

const filterReducer = (state = INITIAL_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case `FIL_${SAVE_FILTERS}`: {
      const { id, filters, joinOperator } = payload;
      const safeFilters = Array.isArray(filters) ? filters : [];
      let parsedFilter = safeFilters.flatMap((f) => f?.parsed ?? []);
      if (joinOperator === JOIN_OPERATORS.ANY)
        parsedFilter = parsedFilter.map((p) => `or(${p})`);
      return {
        ...state,
        id,
        filterValues: safeFilters,
        joinOperator,
        parsedFilter
      };
    }
    default:
      return state;
  }
};

export default filterReducer;
