/**
 * @jest-environment jsdom
 */
import ConnectedSummitSpeakersListPage from "../summit-speakers-list-page";

const SummitSpeakersListPage = ConnectedSummitSpeakersListPage.WrappedComponent;

const buildSubjectProps = () => ({
  term: null,
  order: "full_name",
  page: 1,
  orderDir: 1,
  perPage: 10,
  selectionPlanFilter: [],
  trackFilter: [],
  trackGroupFilter: [],
  activityTypeFilter: [],
  selectionStatusFilter: [],
  mediaUploadTypeFilter: { operator: null, value: [] },
  selectedCount: 0,
  totalActivities: 0
});

const buildInstance = (overrides = {}) => {
  const props = {
    currentSummit: { id: 1, name: "Test Summit" },
    speakersProps: buildSubjectProps(),
    submittersProps: buildSubjectProps(),
    currentPromocodeSpecification: {},
    initSpeakersList: jest.fn(),
    initSubmittersList: jest.fn(),
    getSpeakersBySummit: jest.fn(),
    getSubmittersBySummit: jest.fn(),
    getSelectedSpeakersActivityCount: jest.fn(),
    getSelectedSubmittersActivityCount: jest.fn(),
    ...overrides
  };
  return new SummitSpeakersListPage(props);
};

describe("SummitSpeakersListPage.handleChangeSelectionStatusFilter", () => {
  it.each([
    [["accepted", "published"], ["published"]],
    [["accepted", "not_published"], ["not_published"]]
  ])(
    "collapses %j to only the new exclusive status %j",
    (selectedValues, expected) => {
      const getSpeakersBySummit = jest.fn();
      const instance = buildInstance({ getSpeakersBySummit });

      instance.handleChangeSelectionStatusFilter({
        target: { value: selectedValues }
      });

      const filtersArg = getSpeakersBySummit.mock.calls[0][5];
      expect(filtersArg.selectionStatusFilter).toEqual(expected);
    }
  );

  it.each([
    [["only_accepted", "only_rejected"], ["only_rejected"]],
    [
      ["accepted", "rejected"],
      ["accepted", "rejected"]
    ]
  ])(
    "leaves pre-existing selection-status combinations unchanged: %j -> %j",
    (selectedValues, expected) => {
      const getSpeakersBySummit = jest.fn();
      const instance = buildInstance({ getSpeakersBySummit });

      instance.handleChangeSelectionStatusFilter({
        target: { value: selectedValues }
      });

      const filtersArg = getSpeakersBySummit.mock.calls[0][5];
      expect(filtersArg.selectionStatusFilter).toEqual(expected);
    }
  );
});
