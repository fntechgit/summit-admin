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

  it("leaves non-exclusive multi-select combinations unchanged", () => {
    const getSpeakersBySummit = jest.fn();
    const instance = buildInstance({ getSpeakersBySummit });

    instance.handleChangeSelectionStatusFilter({
      target: { value: ["accepted", "rejected"] }
    });

    const filtersArg = getSpeakersBySummit.mock.calls[0][5];
    expect(filtersArg.selectionStatusFilter).toEqual(["accepted", "rejected"]);
  });

  // Both values can be present at once (see resolveExclusiveSelectionStatusFilter) -
  // resolution depends on which one was already active, not a fixed priority order.
  it.each([[["published"], ["published", "not_published"], ["not_published"]]])(
    "resolves to the newly picked value: previously %j, dropdown reports %j -> %j",
    (previousSelectionStatusFilter, selectedValues, expected) => {
      const getSpeakersBySummit = jest.fn();
      const instance = buildInstance({
        getSpeakersBySummit,
        speakersProps: {
          ...buildSubjectProps(),
          selectionStatusFilter: previousSelectionStatusFilter
        }
      });

      instance.handleChangeSelectionStatusFilter({
        target: { value: selectedValues }
      });

      const filtersArg = getSpeakersBySummit.mock.calls[0][5];
      expect(filtersArg.selectionStatusFilter).toEqual(expected);
    }
  );

  it("switches from an exclusive status to a plain status", () => {
    const getSpeakersBySummit = jest.fn();
    const instance = buildInstance({
      getSpeakersBySummit,
      speakersProps: {
        ...buildSubjectProps(),
        selectionStatusFilter: ["published"]
      }
    });

    instance.handleChangeSelectionStatusFilter({
      target: { value: ["published", "accepted"] }
    });

    const filtersArg = getSpeakersBySummit.mock.calls[0][5];
    expect(filtersArg.selectionStatusFilter).toEqual(["accepted"]);
  });
});
