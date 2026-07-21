import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/datepicker",
  () =>
    function MockMuiFormikDatepicker({ name }) {
      return <input data-testid={`datepicker-${name}`} type="date" />;
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
  const store = mockStore({ mediaUploadState: { media_file_types: [] } });
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
