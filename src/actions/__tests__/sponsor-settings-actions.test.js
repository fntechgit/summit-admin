/**
 * @jest-environment jsdom
 */
import moment from "moment-timezone";
import {
  postRequest,
  putRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import { saveSponsorPurchasesMeta } from "../sponsor-settings-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postRequest: jest.fn(),
  putRequest: jest.fn()
}));

const SHOW_TZ = "America/Los_Angeles";
const PICKER_TZ = "America/New_York";

// Expected epochs in America/Los_Angeles (PDT, UTC-7), computed from UTC
const START_OF_DAY = (month, day) => Date.UTC(2026, month, day, 7, 0, 0) / 1000;
const END_OF_DAY = (month, day) =>
  Date.UTC(2026, month, day + 1, 6, 59, 59) / 1000;

describe("Sponsor Settings Actions", () => {
  describe("saveSponsorPurchasesMeta", () => {
    const dispatch = jest.fn();
    const getState = () => ({
      currentSummitState: {
        currentSummit: { id: 73, time_zone_id: SHOW_TZ }
      },
      sponsorSettingsState: { emptyPurchaseSettings: false }
    });

    beforeEach(() => {
      jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
      putRequest.mockReturnValue(() => () => Promise.resolve());
      postRequest.mockReturnValue(() => () => Promise.resolve());
    });

    afterEach(() => {
      jest.restoreAllMocks();
      putRequest.mockReset();
      postRequest.mockReset();
    });

    it("should store the picked pricing dates in show time regardless of the picker timezone", async () => {
      // the admin's browser is Eastern, the show is Pacific
      const entity = {
        early_bird_end_date: moment.tz("2026-09-04", PICKER_TZ),
        standard_price_end_date: moment.tz("2026-09-25", PICKER_TZ),
        onsite_price_start_date: moment.tz("2026-10-11", PICKER_TZ),
        onsite_price_end_date: moment.tz("2026-10-17", PICKER_TZ)
      };

      await saveSponsorPurchasesMeta(entity)(dispatch, getState);

      const payload = putRequest.mock.calls[0][3];
      expect(payload.early_bird_end_date).toBe(END_OF_DAY(8, 4));
      expect(payload.standard_price_end_date).toBe(END_OF_DAY(8, 25));
      expect(payload.onsite_price_start_date).toBe(START_OF_DAY(9, 11));
      expect(payload.onsite_price_end_date).toBe(END_OF_DAY(9, 17));
    });

    it("should drop empty pricing dates and split the wire transfer emails", async () => {
      const entity = {
        early_bird_end_date: null,
        standard_price_end_date: "",
        onsite_price_start_date: null,
        onsite_price_end_date: null,
        wire_transfer_notification_email: "a@example.com;b@example.com"
      };

      await saveSponsorPurchasesMeta(entity)(dispatch, getState);

      const payload = putRequest.mock.calls[0][3];
      expect(payload).not.toHaveProperty("early_bird_end_date");
      expect(payload).not.toHaveProperty("standard_price_end_date");
      expect(payload).not.toHaveProperty("onsite_price_start_date");
      expect(payload).not.toHaveProperty("onsite_price_end_date");
      expect(payload.wire_transfer_notification_email).toEqual([
        "a@example.com",
        "b@example.com"
      ]);
    });
  });
});
