import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import { buildRoomBookingFilters } from "../room-booking-list-page.helpers";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

describe("buildRoomBookingFilters", () => {
  test("maps each email_filter operator to the legacy EmailFilter operator", () => {
    const build = (operator) =>
      buildRoomBookingFilters([
        { criteria: "email_filter", operator, value: "jane@acme.com" }
      ]).email_filter;

    expect(build(OPERATORS.LIKE.value)).toEqual({
      operator: "owner_email=@",
      value: "jane@acme.com"
    });
    expect(build(OPERATORS.HAS_NOT.value)).toEqual({
      operator: "not_owner_email=@",
      value: "jane@acme.com"
    });
    expect(build(OPERATORS.IS.value)).toEqual({
      operator: "owner_email==",
      value: "jane@acme.com"
    });
    expect(buildRoomBookingFilters([]).email_filter).toEqual({
      operator: null,
      value: ""
    });
  });
});
