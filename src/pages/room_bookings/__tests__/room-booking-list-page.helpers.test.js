import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import { buildRoomBookingFilters } from "../helpers";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

describe("buildRoomBookingFilters", () => {
  test("maps every email_filter entry to its legacy EmailFilter operator", () => {
    expect(
      buildRoomBookingFilters([
        {
          criteria: "email_filter",
          operator: OPERATORS.LIKE.value,
          value: "@acme.com"
        },
        {
          criteria: "email_filter",
          operator: OPERATORS.HAS_NOT.value,
          value: "test"
        },
        {
          criteria: "email_filter",
          operator: OPERATORS.IS.value,
          value: "jane@acme.com"
        }
      ]).email_filter
    ).toEqual([
      { operator: "owner_email=@", value: "@acme.com" },
      { operator: "not_owner_email=@", value: "test" },
      { operator: "owner_email==", value: "jane@acme.com" }
    ]);
    expect(buildRoomBookingFilters([]).email_filter).toEqual([]);
  });
});
