import { createAction } from "openstack-uicore-foundation/lib/utils/actions";

export const SAVE_FILTERS = "SAVE_FILTERS";

export const saveFilters =
  (id, filters = [], joinOperator = "all") =>
  (dispatch) => {
    dispatch(createAction(SAVE_FILTERS)({ id, filters, joinOperator }));
  };
