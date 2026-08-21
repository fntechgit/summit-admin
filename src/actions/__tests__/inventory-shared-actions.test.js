import { deleteRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { deleteFile } from "../inventory-shared-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  deleteRequest: jest.fn()
}));

describe("deleteFile", () => {
  const dispatch = jest.fn();
  const settings = {
    url: "http://test-api/images",
    deletedActionName: "SOME_FILE_DELETED"
  };

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resolves true when the delete request succeeds", async () => {
    deleteRequest.mockImplementation(() => () => () => Promise.resolve());

    const result = await deleteFile(10, settings)(dispatch);

    expect(result).toBe(true);
  });

  it("resolves false (without rejecting) when the delete request fails", async () => {
    deleteRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("boom"))
    );

    const result = await deleteFile(10, settings)(dispatch);

    expect(result).toBe(false);
  });
});
