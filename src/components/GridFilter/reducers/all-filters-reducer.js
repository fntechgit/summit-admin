import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import filterReducer from "./filter-reducer";
import { SAVE_FILTERS } from "../actions/filter-actions";

const DEFAULT_STATE = {
  allFilters: []
};

const allFiltersReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case LOGOUT_USER:
      return DEFAULT_STATE;

    case SAVE_FILTERS: {
      const { id } = payload;
      const { allFilters } = state;
      const filterExists = allFilters.find((f) => f.id === id);
      let newFilters;

      if (filterExists) {
        newFilters = allFilters.map((f) => {
          if (f.id === id) {
            return filterReducer(f, { ...action, type: `FIL_${type}` });
          }
          return f;
        });
      } else {
        newFilters = [
          ...allFilters,
          filterReducer(null, { ...action, type: `FIL_${type}` })
        ];
      }

      return { ...state, allFilters: newFilters };
    }
    default:
      return state;
  }
};

export default allFiltersReducer;
