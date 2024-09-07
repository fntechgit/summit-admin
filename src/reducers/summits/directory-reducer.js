import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  RECEIVE_SUMMITS,
  SUMMIT_ADDED,
  SUMMIT_DELETED
} from "../../actions/summit-actions";

const DEFAULT_STATE = {
  summits: [],
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalSummits: 1
};

const directoryReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case RECEIVE_SUMMITS: {
      const { current_page, total, last_page, data } = payload.response;
      return {
        ...state,
        summits: data,
        currentPage: current_page,
        lastPage: last_page,
        totalSummits: total
      };
    }
    case SUMMIT_ADDED: {
      const { response } = payload;

      return { ...state, summits: [...state.summits, response] };
    }

    case SUMMIT_DELETED: {
      const { summitId } = payload;
      const summits = state.summits.filter((s) => s.id !== summitId);

      return { ...state, summits: [...summits] };
    }

    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    default:
      return state;
  }
};

export default directoryReducer;
