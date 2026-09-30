/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import {
  deleteRequest,
  putRequest,
  putFile
} from "openstack-uicore-foundation/lib/utils/actions";
import { deleteSetting, saveMarketingSetting } from "../marketing-actions";
import { MARKETING_SETTING_TYPE_FILE } from "../../utils/constants";
import * as methods from "../../utils/methods";
import { createMockSummit } from "../../utils/test-utils";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  deleteRequest: jest.fn(),
  putRequest: jest.fn(),
  putFile: jest.fn()
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

describe("saveMarketingSetting", () => {
  const mockStore = configureStore([thunk]);
  const storeState = {
    currentSummitState: { currentSummit: createMockSummit() }
  };

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    putRequest.mockImplementation(() => () => () => Promise.resolve({}));
    putFile.mockImplementation(() => () => () => Promise.resolve({}));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  // Editing any field of an existing FILE setting sends no new upload, so the
  // action used to resolve without a request while the page still reported success.
  it("persists an existing FILE setting that has a preview but no new upload", async () => {
    const store = mockStore(storeState);
    const entity = {
      id: 5,
      key: "EDITED_KEY",
      type: MARKETING_SETTING_TYPE_FILE,
      value: "",
      file: "",
      file_preview: "https://cdn.example.com/existing.png"
    };

    await saveMarketingSetting(entity, null)(store.dispatch, store.getState);

    expect(putRequest).toHaveBeenCalled();
    expect(putFile).not.toHaveBeenCalled();

    const body = putRequest.mock.calls[0][3];
    expect(body.key).toBe("EDITED_KEY");
    // the stored file must not be overwritten with an empty value
    expect(body).not.toHaveProperty("file");
    expect(body).not.toHaveProperty("file_preview");
  });

  it("still skips the request for a FILE setting with neither an upload nor a preview", async () => {
    const store = mockStore(storeState);
    const entity = {
      id: 0,
      key: "NEW_KEY",
      type: MARKETING_SETTING_TYPE_FILE,
      value: "",
      file: "",
      file_preview: ""
    };

    await saveMarketingSetting(entity, null)(store.dispatch, store.getState);

    expect(putRequest).not.toHaveBeenCalled();
    expect(putFile).not.toHaveBeenCalled();
  });

  it("uses putFile when a new upload is present", async () => {
    const store = mockStore(storeState);
    const file = { name: "new.png" };
    const entity = {
      id: 5,
      key: "EDITED_KEY",
      type: MARKETING_SETTING_TYPE_FILE,
      value: "",
      file,
      file_preview: "blob:new"
    };

    await saveMarketingSetting(entity, file)(store.dispatch, store.getState);

    expect(putFile).toHaveBeenCalled();
    expect(putRequest).not.toHaveBeenCalled();
    expect(putFile.mock.calls[0][4].file).toBe(file);
  });
});
