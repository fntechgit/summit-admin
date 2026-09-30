/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { deleteRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { deleteSetting } from "../marketing-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  deleteRequest: jest.fn()
}));

describe("deleteSetting", () => {
  const mockStore = configureStore([thunk]);

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // The thunk must reject on a failed DELETE. An internal .catch(() => {}) here
  // made it always resolve, so marketing-setting-form.js's handleRemoveFile ran
  // its .then() (zeroing the id) on failure and never its restore .catch(),
  // leaving the row on the server and the next save failing with a 412.
  it("rejects when the DELETE fails", async () => {
    deleteRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("500"))
    );
    const store = mockStore({});

    await expect(deleteSetting(5)(store.dispatch)).rejects.toThrow("500");
  });

  it("resolves when the DELETE succeeds", async () => {
    deleteRequest.mockImplementation(() => () => () => Promise.resolve({}));
    const store = mockStore({});

    await expect(deleteSetting(5)(store.dispatch)).resolves.toBeDefined();
  });
});
