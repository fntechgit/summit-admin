import { SAVE_COLUMNS } from "../actions/display-control-actions";

const INITIAL_STATE = {
  id: null,
  selectedColumns: [],
};

const displayControlReducer = (state = INITIAL_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case `DISCTRL_${SAVE_COLUMNS}`: {
      const { id, columns } = payload;
      const safeColumns = Array.isArray(columns) ? columns : [];

      return {
        ...state,
        id,
        selectedColumns: safeColumns,
      };
    }
    default:
      return state;
  }
};

export default displayControlReducer;
