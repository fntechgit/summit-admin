import { getCriterias } from "../promocode-list-page.helpers";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  queryTags: jest.fn(),
  queryMembers: jest.fn()
}));

const criterias = getCriterias(
  ["ALL", "VIP", "SPONSOR"],
  [{ class_name: "MEMBER_PROMO_CODE" }, { class_name: "SPEAKER_PROMO_CODE" }]
);
const byKey = (key) => criterias.find((c) => c.key === key);
const member = { value: 42, label: "Jane Doe", raw: { email: "jane@x.com" } };

describe("promocode list getCriterias", () => {
  test("type offers the real types only, not the ALL placeholder, and filters by type", () => {
    const type = byKey("type");
    expect(type.values.props.options.map((o) => o.value)).toEqual([
      "VIP",
      "SPONSOR"
    ]);
    expect(type.customParser({ value: "VIP" })).toEqual(["type==VIP"]);
  });

  test("class name joins the picked classes with ||", () => {
    expect(
      byKey("class_name").customParser({
        value: ["MEMBER_PROMO_CODE", "SPEAKER_PROMO_CODE"]
      })
    ).toEqual(["class_name==MEMBER_PROMO_CODE||SPEAKER_PROMO_CODE"]);
  });

  test("tags filter by tag id", () => {
    expect(
      byKey("tags").customParser({
        value: [
          { value: 3, label: "a" },
          { value: 7, label: "b" }
        ]
      })
    ).toEqual(["tag_id==3||7"]);
  });

  test("creator filters by the creator's email only", () => {
    expect(byKey("creator").customParser({ value: member })).toEqual([
      "creator_email==jane@x.com"
    ]);
  });

  test("assignee matches the owner or the contact email", () => {
    expect(byKey("assignee").customParser({ value: member })).toEqual([
      "owner_email==jane@x.com,contact_email==jane@x.com"
    ]);
  });
});
