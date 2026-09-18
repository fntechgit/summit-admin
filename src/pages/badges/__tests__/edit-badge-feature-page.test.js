import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import EditBadgeFeaturePage from "../edit-badge-feature-page";
import {
  getBadgeFeature,
  resetBadgeFeatureForm,
  saveBadgeFeature
} from "../../../actions/badge-actions";

// jsdom lacks scrollIntoView, which useScrollToError calls on invalid submit
window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock("../../../actions/badge-actions", () => ({
  getBadgeFeature: jest.fn(),
  resetBadgeFeatureForm: jest.fn(),
  saveBadgeFeature: jest.fn(),
  uploadBadgeFeatureImage: jest.fn(),
  removeBadgeFeatureImage: jest.fn()
}));

jest.mock("react-breadcrumbs", () => ({ Breadcrumb: () => null }));
jest.mock("../../../components/buttons/add-new-button", () => () => null);

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/upload-input",
  () => ({
    __esModule: true,
    default: () => <div data-testid="upload-input" />
  })
);

// Jodit doesn't run in jsdom; a useField-backed input keeps real Formik state
const mockFormikInput = (name) => {
  const { useField } = require("formik");
  const [field] = useField(name);
  return <input data-testid={`field-${name}`} {...field} />;
};

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield",
  () => ({
    __esModule: true,
    default: ({ name }) => mockFormikInput(name)
  })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/texteditor",
  () => ({
    __esModule: true,
    default: ({ name }) => mockFormikInput(name)
  })
);

const emptyEntity = {
  id: 0,
  name: "",
  description: "",
  template_content: "",
  image: null
};

const mockHistory = { push: jest.fn() };

const renderPage = (entity, badgeFeatureId) =>
  renderWithRedux(
    <EditBadgeFeaturePage
      history={mockHistory}
      match={{ params: { badge_feature_id: badgeFeatureId }, url: "/x" }}
    />,
    {
      initialState: {
        currentSummitState: { currentSummit: createMockSummit() },
        currentBadgeFeatureState: { entity, errors: {} }
      }
    }
  );

describe("EditBadgeFeaturePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBadgeFeature.mockReturnValue(() => Promise.resolve());
    resetBadgeFeatureForm.mockReturnValue(() => {});
    saveBadgeFeature.mockReturnValue(() => Promise.resolve());
  });

  it("hides the image upload until the badge feature has been saved", () => {
    renderPage(emptyEntity);
    expect(screen.queryByTestId("upload-input")).not.toBeInTheDocument();
  });

  it("shows the image upload for a saved badge feature", () => {
    renderPage({ ...emptyEntity, id: 5, name: "VIP" }, "5");
    expect(screen.getByTestId("upload-input")).toBeInTheDocument();
  });

  it("does not save when required fields are empty", async () => {
    renderPage(emptyEntity);

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "general.save" })
      );
    });

    expect(saveBadgeFeature).not.toHaveBeenCalled();
  });
});
