import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { yupToFormErrors } from "formik";
import "@testing-library/jest-dom";
import PageTemplatePopup from "../index";
import {
  PAGES_MODULE_KINDS,
  PAGE_MODULES_MEDIA_TYPES
} from "../../../../../utils/constants";

const mockStore = configureStore([thunk]);

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("formik", () => {
  const actual = jest.requireActual("formik");
  return {
    __esModule: true,
    ...actual,
    yupToFormErrors: jest.fn(actual.yupToFormErrors)
  };
});

jest.mock("../../../../../actions/media-file-type-actions", () => ({
  getAllMediaFileTypes: jest.fn(() => () => Promise.resolve())
}));

jest.mock("../../../../../actions/sponsor-actions", () => ({
  querySponsorAddons: jest.fn()
}));

jest.mock(
  "../../../../../components/mui/formik-inputs/mui-formik-datetimepicker",
  () =>
    function MockMuiFormikDatetimepicker({ name }) {
      return <input data-testid={`datepicker-${name}`} type="text" />;
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield",
  () =>
    function MockMuiFormikTextField({ name }) {
      return <input data-testid={`textfield-${name}`} />;
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/select-group",
  () =>
    function MockMuiFormikRadioGroup({ name }) {
      return <div data-testid={`radio-group-${name}`} />;
    }
);

// jsdom does not implement scrollIntoView; stub it so effects that call it
// (auto-scroll to a new/cloned module) don't throw in these component tests.
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

const baseMediaModule = {
  _tempId: "temp-1",
  kind: PAGES_MODULE_KINDS.MEDIA,
  type: PAGE_MODULES_MEDIA_TYPES.INPUT,
  name: "Resume",
  description: "Upload your resume",
  upload_deadline: null
};

const renderPopup = ({
  isGlobal,
  onSave,
  modules = [baseMediaModule]
} = {}) => {
  const store = mockStore({
    mediaUploadState: { media_file_types: [] },
    currentSummitState: {
      currentSummit: { time_zone_id: "America/Los_Angeles" }
    }
  });
  return render(
    <Provider store={store}>
      <PageTemplatePopup
        pageTemplate={{ code: "TPL1", name: "Template 1", modules }}
        onClose={jest.fn()}
        onSave={onSave}
        isGlobal={isGlobal}
      />
    </Provider>
  );
};

describe("PageTemplatePopup — upload_deadline requiredness", () => {
  it("blocks submit when upload_deadline is missing and isGlobal is false", async () => {
    const onSave = jest.fn();
    renderPopup({ isGlobal: false, onSave });

    await userEvent.click(
      screen.getByRole("button", { name: "page_template_list.page_crud.save" })
    );

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it("allows submit when upload_deadline is missing and isGlobal is true", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    renderPopup({ isGlobal: true, onSave });

    await userEvent.click(
      screen.getByRole("button", { name: "page_template_list.page_crud.save" })
    );

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });

  it("clears a stale upload_deadline carried over from a legacy module when isGlobal is true", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    const legacyModule = {
      ...baseMediaModule,
      upload_deadline: 1700000000
    };
    renderPopup({ isGlobal: true, onSave, modules: [legacyModule] });

    await userEvent.click(
      screen.getByRole("button", { name: "page_template_list.page_crud.save" })
    );

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
    expect(onSave.mock.calls[0][0].modules[0].upload_deadline).toBeNull();
  });
});

describe("PageTemplatePopup validation — empty-string normalization", () => {
  it("reports the standard required message (not a Yup cast error) when max_file_size is cleared to an empty string", async () => {
    const module = {
      _tempId: "temp-1",
      kind: PAGES_MODULE_KINDS.MEDIA,
      type: PAGE_MODULES_MEDIA_TYPES.FILE,
      name: "Doc",
      description: "Desc",
      upload_deadline: 1700000000,
      max_file_size: "",
      file_type_id: 1
    };
    renderPopup({ isGlobal: false, onSave: jest.fn(), modules: [module] });

    await userEvent.click(
      screen.getByRole("button", { name: "page_template_list.page_crud.save" })
    );

    await waitFor(() => {
      expect(yupToFormErrors).toHaveBeenCalled();
    });
    const errors = yupToFormErrors.mock.results.at(-1).value;
    expect(errors.modules[0].max_file_size).toBe("validation.required");
  });
});

describe("PageTemplatePopup — cloning modules", () => {
  it("sends cloned modules to save in order, with recomputed custom_order, alongside originals", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    const modules = [
      {
        _tempId: "temp-1",
        id: 11,
        kind: PAGES_MODULE_KINDS.MEDIA,
        type: PAGE_MODULES_MEDIA_TYPES.INPUT,
        custom_order: 0,
        name: "First module",
        description: "First description",
        upload_deadline: null
      },
      {
        _tempId: "temp-2",
        id: 12,
        kind: PAGES_MODULE_KINDS.MEDIA,
        type: PAGE_MODULES_MEDIA_TYPES.INPUT,
        custom_order: 1,
        name: "Second module",
        description: "Second description",
        upload_deadline: null
      }
    ];
    renderPopup({ isGlobal: true, onSave, modules });

    const countInput = screen.getAllByTestId("clone-count-input")[0];
    fireEvent.change(countInput, { target: { value: "2" } });
    await userEvent.click(screen.getAllByTestId("clone-module-btn")[0]);

    await userEvent.click(
      screen.getByRole("button", { name: "page_template_list.page_crud.save" })
    );

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    const savedModules = onSave.mock.calls[0][0].modules;
    expect(savedModules.map((m) => m.name)).toEqual([
      "First module",
      "First module",
      "First module",
      "Second module"
    ]);
    expect(savedModules.map((m) => m.custom_order)).toEqual([0, 1, 2, 3]);
    expect(savedModules[0].id).toBe(11);
    expect(savedModules[1].id).toBeUndefined();
    expect(savedModules[2].id).toBeUndefined();
    expect(savedModules[3].id).toBe(12);
  });
});

describe("PageTemplatePopup — isSaving guard", () => {
  const renderSavingPopup = ({ onClose, onSave }) => {
    const store = mockStore({ mediaUploadState: { media_file_types: [] } });
    return render(
      <Provider store={store}>
        <PageTemplatePopup
          pageTemplate={{ code: "TPL1", name: "Template 1", modules: [] }}
          onClose={onClose}
          onSave={onSave}
          isGlobal
        />
      </Provider>
    );
  };

  it("disables the submit and close buttons while a save is in flight, and closes on success", async () => {
    let resolveSave;
    const onSave = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );
    const onClose = jest.fn();
    renderSavingPopup({ onClose, onSave });

    const saveButton = screen.getByRole("button", {
      name: "page_template_list.page_crud.save"
    });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
    expect(screen.getByTestId("CloseIcon").closest("button")).toBeDisabled();

    resolveSave();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("ignores a second click while saving (no double submit)", async () => {
    let resolveSave;
    const onSave = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );
    renderSavingPopup({ onClose: jest.fn(), onSave });

    const saveButton = screen.getByRole("button", {
      name: "page_template_list.page_crud.save"
    });
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });

    resolveSave();
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps the dialog open and re-enables the form when onSave rejects", async () => {
    const onSave = jest.fn(() => Promise.reject(new Error("save failed")));
    const onClose = jest.fn();
    renderSavingPopup({ onClose, onSave });

    const saveButton = screen.getByRole("button", {
      name: "page_template_list.page_crud.save"
    });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
