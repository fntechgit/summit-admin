// import { LOGOUT_USER } from "../../../security/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import displayControlReducer from "./display-control-reducer";
import { SAVE_COLUMNS } from "../actions/display-control-actions";

const DEFAULT_STATE = {
  allControls: []
};

const allDisplayControlsReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case LOGOUT_USER:
      return DEFAULT_STATE;

    case SAVE_COLUMNS: {
      const { id } = payload;
      const { allControls } = state;
      const controlExists = allControls.find((c) => c.id === id);
      let newControls;

      if (controlExists) {
        newControls = allControls.map((f) => {
          if (f.id === id) {
            return displayControlReducer(f, { ...action, type: `DISCTRL_${type}` });
          }
          return f;
        });
      } else {
        newControls = [
          ...allControls,
          displayControlReducer(null, { ...action, type: `DISCTRL_${type}` })
        ];
      }

      return { ...state, allControls: newControls };
    }
    default:
      return state;
  }
};

export default allDisplayControlsReducer;
