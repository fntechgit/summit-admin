import { useDispatch, useSelector } from "react-redux";
import { saveFilters } from "../actions/filter-actions";
import { JOIN_OPERATORS } from "../utils";

export const EMPTY_FILTER = {
  criteria: null,
  operator: null,
  value: null,
  id: "new"
};

const useGridFilter = (id) => {
  const dispatch = useDispatch();
  const allFilters = useSelector(
    (state) => state.allGridFiltersState.allFilters
  );
  const filter = allFilters.find((f) => f.id === id) || {};
  const {
    filterValues = [],
    joinOperator = JOIN_OPERATORS.ALL,
    parsedFilter = []
  } = filter;

  const valuesWithIds = filterValues.map((v, i) => ({
    ...v,
    id: `${v.criteria}-${i}`
  }));

  const resetFilters = () => dispatch(saveFilters(id));

  return {
    filterValues,
    filterCount: filterValues.length,
    joinOperator,
    parsedFilter,
    valuesWithIds,
    resetFilters
  };
};

export default useGridFilter;
