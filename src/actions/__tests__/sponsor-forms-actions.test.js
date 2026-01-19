import * as OpenStackUiCoreActions from "openstack-uicore-foundation/lib/utils/actions";
import { deleteSponsorFormItem } from "../sponsor-forms-actions";
import * as UtilsMethods from "../../utils/methods";
import * as BaseActions from "../base-actions";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => {
  const originalModule = jest.requireActual(
    "openstack-uicore-foundation/lib/utils/actions"
  );

  return {
    __esModule: true,
    ...originalModule,
    deleteRequest: jest.fn(() => () => () => Promise.resolve())
  };
});

describe("SponsorFormActions", () => {
  describe("DeleteSponsorFormItem", () => {
    afterEach(() => {
      // restore the spy created with spyOn
      jest.restoreAllMocks();
    });

    it("execute", async () => {
      const mockedDispatch = jest.fn();
      const mockedGetState = jest.fn(() => ({
        currentSummitState: {
          currentSummit: "SSS"
        },
        sponsorFormItemsListState: {
          currentPage: 1,
          perPage: 10,
          order: "asc",
          orderDir: 1,
          hideArchived: false
        }
      }));

      const params = {
        formId: "AAA",
        itemId: "III"
      };

      const spyOnGetAccessTokenSafely = jest
        .spyOn(UtilsMethods, "getAccessTokenSafely")
        .mockImplementation(() => "access _token");
      const spyOnSnackbarSuccessHandler = jest.spyOn(
        BaseActions,
        "snackbarSuccessHandler"
      );

      await deleteSponsorFormItem(params.formId, params.itemId)(
        mockedDispatch,
        mockedGetState
      );

      // gets acces token safely
      expect(spyOnGetAccessTokenSafely).toHaveBeenCalled();
      // calls delete request
      expect(OpenStackUiCoreActions.deleteRequest).toHaveBeenCalled();
      // shows snackbar
      expect(spyOnSnackbarSuccessHandler).toHaveBeenCalled();
    });
  });
});
