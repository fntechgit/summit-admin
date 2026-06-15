// import { createAction } from "../../../../utils/actions";
import { createAction } from "openstack-uicore-foundation/lib/utils/actions";

export const SAVE_COLUMNS = "SAVE_COLUMNS";

export const saveColumns =
  (id, selectedColumns = []) =>
  (dispatch) => {
    dispatch(createAction(SAVE_COLUMNS)({ id, selectedColumns }));
  };
