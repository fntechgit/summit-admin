import { createAction } from "openstack-uicore-foundation/lib/utils/actions";
import { JOIN_OPERATORS } from "../utils";

export const SAVE_FILTERS = "SAVE_FILTERS";

export const saveFilters =
  (id, filters = [], joinOperator = JOIN_OPERATORS.ALL) =>
  (dispatch) => {
    dispatch(createAction(SAVE_FILTERS)({ id, filters, joinOperator }));
  };
