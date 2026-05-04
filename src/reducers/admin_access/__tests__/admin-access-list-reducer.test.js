import adminAccessListReducer from "../admin-access-list-reducer";
import { ADMIN_ACCESS_DELETED } from "../../../actions/admin-access-actions";

describe("adminAccessListReducer", () => {
  test("decrements totalAdminAccesses when deleting an existing row", () => {
    const initialState = {
      admin_accesses: [
        { id: 10, title: "Group A" },
        { id: 11, title: "Group B" }
      ],
      totalAdminAccesses: 2,
      term: "",
      order: "id",
      orderDir: 1,
      currentPage: 1,
      lastPage: 1,
      perPage: 10
    };

    const result = adminAccessListReducer(initialState, {
      type: ADMIN_ACCESS_DELETED,
      payload: { adminAccessId: 10 }
    });

    expect(result.admin_accesses).toStrictEqual([{ id: 11, title: "Group B" }]);
    expect(result.totalAdminAccesses).toBe(1);
  });

  test("keeps totalAdminAccesses when deleted id does not exist", () => {
    const initialState = {
      admin_accesses: [{ id: 10, title: "Group A" }],
      totalAdminAccesses: 1,
      term: "",
      order: "id",
      orderDir: 1,
      currentPage: 1,
      lastPage: 1,
      perPage: 10
    };

    const result = adminAccessListReducer(initialState, {
      type: ADMIN_ACCESS_DELETED,
      payload: { adminAccessId: 999 }
    });

    expect(result.admin_accesses).toStrictEqual([{ id: 10, title: "Group A" }]);
    expect(result.totalAdminAccesses).toBe(1);
  });
});
