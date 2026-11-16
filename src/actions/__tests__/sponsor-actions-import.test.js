/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { postFile } from "openstack-uicore-foundation/lib/utils/actions";
import { importSponsorsCSV } from "../sponsor-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postFile: jest.fn()
}));

describe("importSponsorsCSV", () => {
  const mockStore = configureStore([thunk]);
  const originalApiBaseUrl = window.API_BASE_URL;

  beforeEach(() => {
    window.API_BASE_URL = "http://test-api";
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
  });

  afterEach(() => {
    window.API_BASE_URL = originalApiBaseUrl;
    jest.restoreAllMocks();
    postFile.mockReset();
  });

  it.each([
    [true, "1"],
    [false, "0"]
  ])(
    "posts the file to the sponsors csv endpoint with dry_run %s and resolves with the report",
    async (dryRun, dryRunField) => {
      const report = { dry_run: dryRun, summary: {}, rows: [] };
      postFile.mockImplementation(
        () => () => () => Promise.resolve({ response: report })
      );
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 42 } }
      });
      const file = new File(["company,tier"], "s.csv", { type: "text/csv" });

      await expect(
        store.dispatch(importSponsorsCSV(file, dryRun))
      ).resolves.toEqual(report);

      const [, , url, sentFile, fields] = postFile.mock.calls[0];
      expect(url).toBe("http://test-api/api/v1/summits/42/sponsors/csv");
      expect(sentFile).toBe(file);
      expect(fields).toEqual({ dry_run: dryRunField });
    }
  );
});
