import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import addOnTypeReducer, {
  DEFAULT_ENTITY
} from "../sponsors_inventory/add-on-type-reducer";
import addOnTypesListReducer from "../sponsors_inventory/add-on-types-list-reducer";
import {
  REQUEST_ADD_ON_TYPES,
  RECEIVE_ADD_ON_TYPES,
  RECEIVE_ADD_ON_TYPE,
  RESET_ADD_ON_TYPE_FORM,
  ADD_ON_TYPE_DELETED
} from "../../actions/add-on-types-actions";

// ─── addOnTypeReducer ─────────────────────────────────────────────────────────

describe("addOnTypeReducer", () => {
  it("RESET_ADD_ON_TYPE_FORM resets entity and clears errors", () => {
    const dirty = {
      entity: { id: 3, name: "Foo" },
      errors: { name: "required" }
    };
    const state = addOnTypeReducer(dirty, {
      type: RESET_ADD_ON_TYPE_FORM,
      payload: {}
    });
    expect(state.entity).toEqual(DEFAULT_ENTITY);
    expect(state.errors).toEqual({});
  });

  it("RECEIVE_ADD_ON_TYPE merges response into entity", () => {
    const initial = { entity: DEFAULT_ENTITY, errors: {} };
    const state = addOnTypeReducer(initial, {
      type: RECEIVE_ADD_ON_TYPE,
      payload: { response: { id: 5, name: "VIP Pass" } }
    });
    expect(state.entity.id).toBe(5);
    expect(state.entity.name).toBe("VIP Pass");
  });

  it("LOGOUT_USER without persistStore resets entity and errors", () => {
    const dirty = {
      entity: { id: 3, name: "Foo" },
      errors: { name: "required" }
    };
    const state = addOnTypeReducer(dirty, { type: LOGOUT_USER, payload: {} });
    expect(state.entity).toEqual(DEFAULT_ENTITY);
    expect(state.errors).toEqual({});
  });

  it("LOGOUT_USER with persistStore preserves current state", () => {
    const dirty = { entity: { id: 3, name: "Foo" }, errors: {} };
    const state = addOnTypeReducer(dirty, {
      type: LOGOUT_USER,
      payload: { persistStore: true }
    });
    expect(state).toEqual(dirty);
  });
});

// ─── addOnTypesListReducer ────────────────────────────────────────────────────

describe("addOnTypesListReducer", () => {
  const emptyState = addOnTypesListReducer(undefined, { type: "@@INIT" });

  it("returns empty addOnTypes and zero total for unknown action", () => {
    expect(emptyState.addOnTypes).toEqual([]);
    expect(emptyState.totalAddOnTypes).toBe(0);
  });

  it("LOGOUT_USER resets list to empty", () => {
    const dirty = {
      ...emptyState,
      addOnTypes: [{ id: 1 }],
      totalAddOnTypes: 1
    };
    const state = addOnTypesListReducer(dirty, {
      type: LOGOUT_USER,
      payload: {}
    });
    expect(state.addOnTypes).toEqual([]);
    expect(state.totalAddOnTypes).toBe(0);
  });

  describe("REQUEST_ADD_ON_TYPES", () => {
    it("clears addOnTypes when not a page/sort change (e.g. new search)", () => {
      const stateWithData = { ...emptyState, addOnTypes: [{ id: 1 }] };
      const state = addOnTypesListReducer(stateWithData, {
        type: REQUEST_ADD_ON_TYPES,
        payload: {
          order: "name",
          orderDir: 1,
          page: 1,
          perPage: 10,
          term: "vip"
        }
      });
      expect(state.addOnTypes).toEqual([]);
    });

    it("preserves addOnTypes when only the page changes", () => {
      const stateWithData = {
        ...emptyState,
        addOnTypes: [{ id: 1 }],
        currentPage: 1
      };
      const state = addOnTypesListReducer(stateWithData, {
        type: REQUEST_ADD_ON_TYPES,
        payload: {
          order: "name",
          orderDir: 1,
          page: 2,
          perPage: 10,
          term: null
        }
      });
      expect(state.addOnTypes).toEqual([{ id: 1 }]);
      expect(state.currentPage).toBe(2);
    });
  });

  describe("RECEIVE_ADD_ON_TYPES", () => {
    it("populates addOnTypes, totalAddOnTypes and currentPage from response", () => {
      const state = addOnTypesListReducer(emptyState, {
        type: RECEIVE_ADD_ON_TYPES,
        payload: {
          response: {
            data: [
              { id: 1, name: "Early Bird" },
              { id: 2, name: "VIP" }
            ],
            current_page: 1,
            last_page: 3,
            total: 25
          }
        }
      });
      expect(state.addOnTypes).toHaveLength(2);
      expect(state.totalAddOnTypes).toBe(25);
      expect(state.currentPage).toBe(1);
    });
  });

  describe("ADD_ON_TYPE_DELETED", () => {
    it("removes the item with the matching id", () => {
      const stateWithData = {
        ...emptyState,
        addOnTypes: [
          { id: 1, name: "Early Bird" },
          { id: 2, name: "VIP" }
        ]
      };
      const state = addOnTypesListReducer(stateWithData, {
        type: ADD_ON_TYPE_DELETED,
        payload: { addOnTypeId: 1 }
      });
      expect(state.addOnTypes).toHaveLength(1);
      expect(state.addOnTypes[0].id).toBe(2);
    });
  });
});
