import { useSelector } from "react-redux";

export const EMPTY_FILTER = {
  criteria: null,
  operator: null,
  value: null,
  id: "new"
};

const useGridFilter = (id) => {
  const allFilters = useSelector(
    (state) => state.allGridFiltersState.allFilters
  );
  const filter = allFilters.find((f) => f.id === id) || {};
  const { filterValues = [], joinOperator = "all", parsedFilter = [] } = filter;

  const valuesWithIds = filterValues.map((v, i) => ({
    ...v,
    id: `${v.criteria}-${i}`
  }));

  return {
    filterValues,
    filterCount: filterValues.length,
    joinOperator,
    parsedFilter,
    valuesWithIds
  };
};

export default useGridFilter;
