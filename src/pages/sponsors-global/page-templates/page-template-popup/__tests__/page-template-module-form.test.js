import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form, useFormikContext } from "formik";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import moment from "moment-timezone";
import "@testing-library/jest-dom";
import showConfirmDialog from "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog";
import PageModules from "../page-template-modules-form";
import {
  PAGES_MODULE_KINDS,
  PAGE_MODULES_MEDIA_TYPES,
  PAGE_MODULES_DOWNLOAD
} from "../../../../../utils/constants";

const mockStore = configureStore([thunk]);

// Mocks
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog",
  () => jest.fn()
);
jest.mock("../../../../../actions/media-file-type-actions", () => ({
  getAllMediaFileTypes: jest.fn(() => () => Promise.resolve())
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/texteditor",
  () =>
    function MockFormikTextEditor({ name }) {
      return <textarea data-testid={`text-editor-${name}`} />;
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/upload",
  () =>
    function MockMuiFormikUpload({ name }) {
      return <div data-testid={`upload-${name}`}>Upload</div>;
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
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/select",
  () =>
    function MockMuiFormikSelect({ name, children }) {
      return <select data-testid={`select-${name}`}>{children}</select>;
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/radio-group",
  () =>
    function MockMuiFormikRadioGroup({ name }) {
      return <div data-testid={`radio-group-${name}`} />;
    }
);

// Mock DragAndDropList to capture onReorder and the items it receives
let capturedOnReorder = null;
let capturedItems = null;
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/dnd-list",
  () =>
    function MockDragAndDropList({ items, renderItem, onReorder }) {
      capturedOnReorder = onReorder;
      capturedItems = items;
      return (
        <div data-testid="dnd-list">
          {items.map((item, index) => (
            <div key={item._tempId || index} data-testid={`dnd-item-${index}`}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      );
    }
);

// Helper function to render the component with Formik and Redux
const renderWithFormik = (
  initialValues = { modules: [] },
  isGlobal = false
) => {
  const store = mockStore({
    mediaUploadState: {
      media_file_types: []
    },
    currentSummitState: {
      currentSummit: { time_zone_id: "America/Los_Angeles" }
    }
  });
  return render(
    <Provider store={store}>
      <Formik initialValues={initialValues} onSubmit={jest.fn()}>
        <Form>
          <PageModules name="modules" isGlobal={isGlobal} />
        </Form>
      </Formik>
    </Provider>
  );
};

// jsdom does not implement scrollIntoView; stub it so effects that call it
// (auto-scroll to a new/cloned module) don't throw in these component tests.
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe("PageModules", () => {
  const createModule = (kind, order, id) => ({
    _tempId: `temp-${id}`,
    kind,
    custom_order: order,
    name: `Module ${id}`,
    content: "",
    description: "",
    ...(kind === PAGES_MODULE_KINDS.MEDIA && {
      type: PAGE_MODULES_MEDIA_TYPES.FILE,
      upload_deadline: null,
      max_file_size: 100,
      file_type_id: 1
    }),
    ...(kind === PAGES_MODULE_KINDS.DOCUMENT && {
      external_url: "",
      file: null
    })
  });

  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnReorder = null;
    capturedItems = null;
  });

  describe("Rendering", () => {
    test("renders empty state message when no modules exist", () => {
      renderWithFormik({ modules: [] });

      expect(
        screen.getByText("page_template_list.page_crud.no_modules")
      ).toBeInTheDocument();
    });

    test("renders DragAndDropList when modules exist", () => {
      const modules = [createModule(PAGES_MODULE_KINDS.INFO, 0, 1)];
      renderWithFormik({ modules });

      expect(screen.getByTestId("dnd-list")).toBeInTheDocument();
      expect(
        screen.queryByText("page_template_list.page_crud.no_modules")
      ).not.toBeInTheDocument();
    });

    test("renders correct number of modules", () => {
      const modules = [
        createModule(PAGES_MODULE_KINDS.INFO, 0, 1),
        createModule(PAGES_MODULE_KINDS.DOCUMENT, 1, 2),
        createModule(PAGES_MODULE_KINDS.MEDIA, 2, 3)
      ];

      renderWithFormik({ modules });

      expect(screen.getByTestId("dnd-item-0")).toBeInTheDocument();
      expect(screen.getByTestId("dnd-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("dnd-item-2")).toBeInTheDocument();
    });
  });

  describe("isGlobal", () => {
    test("shows the upload deadline picker for a MEDIA module when isGlobal is false", () => {
      const modules = [createModule(PAGES_MODULE_KINDS.MEDIA, 0, 1)];
      const { container } = renderWithFormik({ modules }, false);

      expect(
        container.querySelector("input[name='modules[0].upload_deadline']")
      ).toBeInTheDocument();
    });

    test("hides the upload deadline picker for a MEDIA module when isGlobal is true", () => {
      const modules = [createModule(PAGES_MODULE_KINDS.MEDIA, 0, 1)];
      const { container } = renderWithFormik({ modules }, true);

      expect(
        container.querySelector("input[name='modules[0].upload_deadline']")
      ).not.toBeInTheDocument();
    });
  });

  describe("Upload deadline time entry", () => {
    test("shows the stored time in the upload deadline field", () => {
      const modules = [
        {
          ...createModule(PAGES_MODULE_KINDS.MEDIA, 0, 1),
          upload_deadline: moment.tz("2026-08-15 17:30", "America/Los_Angeles")
        }
      ];
      const { container } = renderWithFormik({ modules }, false);

      const input = container.querySelector(
        "input[name='modules[0].upload_deadline']"
      );
      expect(input).toHaveValue("08/15/2026 05:30 PM");
    });

    test("renders the upload deadline in the summit timezone", () => {
      const modules = [
        {
          ...createModule(PAGES_MODULE_KINDS.MEDIA, 0, 1),
          upload_deadline: moment.utc("2026-08-15T22:00:00Z")
        }
      ];
      const { container } = renderWithFormik({ modules }, false);

      const input = container.querySelector(
        "input[name='modules[0].upload_deadline']"
      );
      // 22:00 UTC is 15:00 (3:00 PM) in America/Los_Angeles during PDT
      expect(input).toHaveValue("08/15/2026 03:00 PM");
    });
  });

  describe("Module ordering", () => {
    test("renders modules in the order they appear in the array", () => {
      const modules = [
        createModule(PAGES_MODULE_KINDS.INFO, 0, 1),
        createModule(PAGES_MODULE_KINDS.DOCUMENT, 1, 2),
        createModule(PAGES_MODULE_KINDS.MEDIA, 2, 3)
      ];

      const { container } = renderWithFormik({ modules });

      // INFO module has content field
      expect(
        screen.getByTestId("text-editor-modules[0].content")
      ).toBeInTheDocument();
      // DOCUMENT module has name field
      expect(
        screen.getByTestId("textfield-modules[1].name")
      ).toBeInTheDocument();
      // MEDIA module has upload_deadline field
      expect(
        container.querySelector("input[name='modules[2].upload_deadline']")
      ).toBeInTheDocument();
    });

    test("maintains custom_order values after rendering", () => {
      const TestWrapper = () => {
        const { values } = useFormikContext();
        return (
          <>
            <PageModules name="modules" />
            <div data-testid="orders">
              {values.modules.map((m, i) => (
                // eslint-disable-next-line
                <span key={i} data-testid={`order-${i}`}>
                  {m.custom_order}
                </span>
              ))}
            </div>
          </>
        );
      };

      const modules = [
        createModule(PAGES_MODULE_KINDS.INFO, 0, 1),
        createModule(PAGES_MODULE_KINDS.DOCUMENT, 1, 2),
        createModule(PAGES_MODULE_KINDS.MEDIA, 2, 3)
      ];

      const store = mockStore({
        mediaUploadState: {
          media_file_types: []
        }
      });
      render(
        <Provider store={store}>
          <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
            <Form>
              <TestWrapper />
            </Form>
          </Formik>
        </Provider>
      );

      expect(screen.getByTestId("order-0")).toHaveTextContent("0");
      expect(screen.getByTestId("order-1")).toHaveTextContent("1");
      expect(screen.getByTestId("order-2")).toHaveTextContent("2");
    });
  });

  describe("Drag and drop reordering", () => {
    test("updates modules order when onReorder is called", async () => {
      const TestWrapper = () => {
        const { values } = useFormikContext();
        return (
          <>
            <PageModules name="modules" />
            <div data-testid="module-ids">
              {values.modules.map((m) => m._tempId).join(",")}
            </div>
          </>
        );
      };

      const modules = [
        createModule(PAGES_MODULE_KINDS.INFO, 0, 1),
        createModule(PAGES_MODULE_KINDS.DOCUMENT, 1, 2),
        createModule(PAGES_MODULE_KINDS.MEDIA, 2, 3)
      ];

      const store = mockStore({
        mediaUploadState: {
          media_file_types: []
        }
      });
      render(
        <Provider store={store}>
          <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
            <Form>
              <TestWrapper />
            </Form>
          </Formik>
        </Provider>
      );

      expect(screen.getByTestId("module-ids")).toHaveTextContent(
        "temp-1,temp-2,temp-3"
      );

      // move first module to the end
      const reorderedModules = [modules[1], modules[2], modules[0]];
      capturedOnReorder(reorderedModules);

      await waitFor(() => {
        expect(screen.getByTestId("module-ids")).toHaveTextContent(
          "temp-2,temp-3,temp-1"
        );
      });
    });

    test("updates field indices after reordering", async () => {
      const TestWrapper = () => {
        const { values } = useFormikContext();
        return (
          <>
            <PageModules name="modules" />
            <div data-testid="first-module-kind">{values.modules[0]?.kind}</div>
          </>
        );
      };

      const modules = [
        createModule(PAGES_MODULE_KINDS.INFO, 0, 1),
        createModule(PAGES_MODULE_KINDS.DOCUMENT, 1, 2)
      ];

      const store = mockStore({
        mediaUploadState: {
          media_file_types: []
        }
      });
      render(
        <Provider store={store}>
          <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
            <Form>
              <TestWrapper />
            </Form>
          </Formik>
        </Provider>
      );

      expect(screen.getByTestId("first-module-kind")).toHaveTextContent(
        PAGES_MODULE_KINDS.INFO
      );

      // invert order
      const reorderedModules = [modules[1], modules[0]];
      capturedOnReorder(reorderedModules);

      await waitFor(() => {
        expect(screen.getByTestId("first-module-kind")).toHaveTextContent(
          PAGES_MODULE_KINDS.DOCUMENT
        );
      });
    });
  });

  describe("Accordion expand/collapse", () => {
    test("accordion is expanded by default", () => {
      const modules = [createModule(PAGES_MODULE_KINDS.INFO, 0, 1)];
      renderWithFormik({ modules });

      // content should be visible
      expect(
        screen.getByTestId("text-editor-modules[0].content")
      ).toBeVisible();
    });

    test("collapses accordion when clicking on summary", async () => {
      const modules = [createModule(PAGES_MODULE_KINDS.INFO, 0, 1)];
      renderWithFormik({ modules });

      const expandIcon = screen.getByTestId("ExpandMoreIcon");
      const accordionSummary = expandIcon.closest(".MuiAccordionSummary-root");

      // Initially should be expanded
      expect(accordionSummary).toHaveAttribute("aria-expanded", "true");

      await userEvent.click(accordionSummary);

      await waitFor(() => {
        expect(accordionSummary).toHaveAttribute("aria-expanded", "false");
      });
    });

    test("expands collapsed accordion when clicking on summary", async () => {
      const modules = [createModule(PAGES_MODULE_KINDS.INFO, 0, 1)];
      renderWithFormik({ modules });

      const expandIcon = screen.getByTestId("ExpandMoreIcon");
      const accordionSummary = expandIcon.closest(".MuiAccordionSummary-root");

      // close
      await userEvent.click(accordionSummary);

      await waitFor(() => {
        expect(
          screen.getByTestId("text-editor-modules[0].content")
        ).not.toBeVisible();
      });

      // expand
      await userEvent.click(accordionSummary);

      await waitFor(() => {
        expect(
          screen.getByTestId("text-editor-modules[0].content")
        ).toBeVisible();
      });
    });

    test("each accordion operates independently", async () => {
      const modules = [
        createModule(PAGES_MODULE_KINDS.INFO, 0, 1),
        createModule(PAGES_MODULE_KINDS.DOCUMENT, 1, 2)
      ];
      renderWithFormik({ modules });

      const expandIcons = screen.getAllByTestId("ExpandMoreIcon");
      const firstAccordionSummary = expandIcons[0].closest(
        ".MuiAccordionSummary-root"
      );
      const secondAccordionSummary = expandIcons[1].closest(
        ".MuiAccordionSummary-root"
      );

      // Both should be expanded initially
      expect(firstAccordionSummary).toHaveAttribute("aria-expanded", "true");
      expect(secondAccordionSummary).toHaveAttribute("aria-expanded", "true");

      // close first module
      await userEvent.click(firstAccordionSummary);

      await waitFor(() => {
        // first module should be closed
        expect(firstAccordionSummary).toHaveAttribute("aria-expanded", "false");
        // second module should still be expanded
        expect(secondAccordionSummary).toHaveAttribute("aria-expanded", "true");
      });
    });
  });

  describe("handleDeleteModule", () => {
    test("shows confirmation dialog when delete button is clicked", async () => {
      showConfirmDialog.mockResolvedValue(false);

      const modules = [createModule(PAGES_MODULE_KINDS.INFO, 0, 1)];
      renderWithFormik({ modules });

      const deleteButton = screen.getByTestId("delete-module-btn");
      await userEvent.click(deleteButton);

      expect(showConfirmDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "warning",
          showCancelButton: true
        })
      );
    });

    test("removes module from list when confirmed", async () => {
      showConfirmDialog.mockResolvedValue(true);

      const TestWrapper = () => {
        const { values } = useFormikContext();
        return (
          <>
            <PageModules name="modules" />
            <div data-testid="module-count">{values.modules.length}</div>
          </>
        );
      };

      const modules = [
        createModule(PAGES_MODULE_KINDS.INFO, 0, 1),
        createModule(PAGES_MODULE_KINDS.DOCUMENT, 1, 2)
      ];

      const store = mockStore({
        mediaUploadState: {
          media_file_types: []
        }
      });
      render(
        <Provider store={store}>
          <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
            <Form>
              <TestWrapper />
            </Form>
          </Formik>
        </Provider>
      );

      expect(screen.getByTestId("module-count")).toHaveTextContent("2");

      const deleteButtons = screen.getAllByTestId("DeleteIcon");
      await userEvent.click(deleteButtons[0].closest("button"));

      await waitFor(() => {
        expect(screen.getByTestId("module-count")).toHaveTextContent("1");
      });
    });

    test("does not remove module when cancelled", async () => {
      showConfirmDialog.mockResolvedValue(false);

      const TestWrapper = () => {
        const { values } = useFormikContext();
        return (
          <>
            <PageModules name="modules" />
            <div data-testid="module-count">{values.modules.length}</div>
          </>
        );
      };

      const modules = [createModule(PAGES_MODULE_KINDS.INFO, 0, 1)];

      const store = mockStore({
        mediaUploadState: {
          media_file_types: []
        }
      });
      render(
        <Provider store={store}>
          <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
            <Form>
              <TestWrapper />
            </Form>
          </Formik>
        </Provider>
      );

      const deleteButton = screen.getByTestId("DeleteIcon").closest("button");
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId("module-count")).toHaveTextContent("1");
      });
    });

    test("removes correct module when deleting from middle of list", async () => {
      showConfirmDialog.mockResolvedValue(true);

      const TestWrapper = () => {
        const { values } = useFormikContext();
        return (
          <>
            <PageModules name="modules" />
            <div data-testid="module-ids">
              {values.modules.map((m) => m._tempId).join(",")}
            </div>
          </>
        );
      };

      const modules = [
        createModule(PAGES_MODULE_KINDS.INFO, 0, 1),
        createModule(PAGES_MODULE_KINDS.DOCUMENT, 1, 2),
        createModule(PAGES_MODULE_KINDS.MEDIA, 2, 3)
      ];

      const store = mockStore({
        mediaUploadState: {
          media_file_types: []
        }
      });
      render(
        <Provider store={store}>
          <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
            <Form>
              <TestWrapper />
            </Form>
          </Formik>
        </Provider>
      );

      // deletes middle module
      const deleteButtons = screen.getAllByTestId("DeleteIcon");
      await userEvent.click(deleteButtons[1].closest("button"));

      await waitFor(() => {
        expect(screen.getByTestId("module-ids")).toHaveTextContent(
          "temp-1,temp-3"
        );
      });
    });
  });

  describe("Cloning modules", () => {
    const renderModulesWithWrapper = (modules) => {
      const TestWrapper = () => {
        const { values } = useFormikContext();
        return (
          <>
            <PageModules name="modules" />
            <div data-testid="module-ids">
              {values.modules.map((m) => m._tempId).join(",")}
            </div>
            <div data-testid="module-has-id">
              {values.modules.map((m) => (m.id ? "1" : "0")).join(",")}
            </div>
          </>
        );
      };

      const store = mockStore({
        mediaUploadState: { media_file_types: [] }
      });
      return render(
        <Provider store={store}>
          <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
            <Form>
              <TestWrapper />
            </Form>
          </Formik>
        </Provider>
      );
    };

    test("inserts N copies immediately after the original, each with a fresh temp id and no persisted id, and scrolls to the last one", async () => {
      const modules = [
        { ...createModule(PAGES_MODULE_KINDS.INFO, 0, 1), id: 100 },
        createModule(PAGES_MODULE_KINDS.DOCUMENT, 1, 2),
        createModule(PAGES_MODULE_KINDS.MEDIA, 2, 3)
      ];
      renderModulesWithWrapper(modules);

      const countInput = screen.getAllByTestId("clone-count-input")[0];
      fireEvent.change(countInput, { target: { value: "3" } });
      await userEvent.click(screen.getAllByTestId("clone-module-btn")[0]);

      await waitFor(() => {
        expect(screen.getByTestId("module-ids")).toHaveTextContent(
          /^temp-1,temp-clone-\d+,temp-clone-\d+,temp-clone-\d+,temp-2,temp-3$/
        );
      });
      expect(screen.getByTestId("module-has-id")).toHaveTextContent(
        "1,0,0,0,0,0"
      );
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });

    test("keeps a stable DnD key (derived from id) for a persisted module lacking _tempId, even after a clone shifts its array index", async () => {
      // a module loaded from the API with no _tempId, as denormalizePageModules
      // produces it — DragAndDropList's own idKey fallback is index-based, so
      // without normalization this module's key would change (forcing a
      // remount) whenever an earlier clone shifts its position.
      const persistedNoTempId = {
        id: 200,
        kind: PAGES_MODULE_KINDS.INFO,
        custom_order: 1,
        name: "Persisted module",
        content: ""
      };
      const modules = [
        createModule(PAGES_MODULE_KINDS.INFO, 0, 1),
        persistedNoTempId
      ];
      renderModulesWithWrapper(modules);

      expect(capturedItems[1]._tempId).toBe(200);

      const countInput = screen.getAllByTestId("clone-count-input")[0];
      fireEvent.change(countInput, { target: { value: "2" } });
      await userEvent.click(screen.getAllByTestId("clone-module-btn")[0]);

      await waitFor(() => {
        expect(screen.getByTestId("module-ids")).toHaveTextContent(
          /^temp-1,temp-clone-\d+,temp-clone-\d+,$/
        );
      });

      // now at index 3 instead of 1, but the DnD key tracks the module, not the slot
      const shiftedIndex = capturedItems.findIndex((m) => m.id === 200);
      expect(shiftedIndex).toBe(3);
      expect(capturedItems[shiftedIndex]._tempId).toBe(200);
    });

    // Cloning has no MEDIA-type-specific branching (unlike DOCUMENT, see below) —
    // both variants exercise the same generic-copy code path, so a single
    // parameterized test documents that max_file_size/file_type_id are carried
    // over as-is regardless of type (they're only stripped for INPUT later, by
    // normalizePageTemplateModules at save time, not by cloning).
    test.each([
      ["File", PAGE_MODULES_MEDIA_TYPES.FILE],
      ["Input", PAGE_MODULES_MEDIA_TYPES.INPUT]
    ])(
      "clones a Media (type=%s) module and propagates its fields as-is",
      async (_description, type) => {
        const modules = [
          { ...createModule(PAGES_MODULE_KINDS.MEDIA, 0, 1), type }
        ];

        const TestWrapper = () => {
          const { values } = useFormikContext();
          const clone = values.modules[1];
          return (
            <>
              <PageModules name="modules" />
              <div data-testid="clone-media-fields">
                {JSON.stringify({
                  type: clone?.type,
                  max_file_size: clone?.max_file_size,
                  file_type_id: clone?.file_type_id
                })}
              </div>
            </>
          );
        };

        const store = mockStore({
          mediaUploadState: { media_file_types: [] }
        });
        render(
          <Provider store={store}>
            <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
              <Form>
                <TestWrapper />
              </Form>
            </Formik>
          </Provider>
        );

        await userEvent.click(screen.getByTestId("clone-module-btn"));

        await waitFor(() => {
          expect(screen.getByTestId("clone-media-fields")).toHaveTextContent(
            JSON.stringify({ type, max_file_size: 100, file_type_id: 1 })
          );
        });
      }
    );

    test.each([
      ["0", 1],
      ["999", 20]
    ])("clamps a typed count of %s to %i on blur", (typedValue, expected) => {
      const modules = [createModule(PAGES_MODULE_KINDS.INFO, 0, 1)];
      renderModulesWithWrapper(modules);

      const countInput = screen.getByTestId("clone-count-input");
      fireEvent.change(countInput, { target: { value: typedValue } });
      fireEvent.blur(countInput);

      expect(countInput).toHaveValue(expected);
    });

    test("allows freely editing (e.g. backspacing) the count field without clamping mid-edit", () => {
      const modules = [createModule(PAGES_MODULE_KINDS.INFO, 0, 1)];
      renderModulesWithWrapper(modules);

      const countInput = screen.getByTestId("clone-count-input");
      fireEvent.change(countInput, { target: { value: "15" } });
      expect(countInput).toHaveValue(15);

      // backspace to clear, as a user retyping the value would
      fireEvent.change(countInput, { target: { value: "" } });
      expect(countInput).toHaveValue(null);

      fireEvent.change(countInput, { target: { value: "5" } });
      expect(countInput).toHaveValue(5);
    });

    test("collapses new clones, keeps the original expanded, and resets the count field to 1", async () => {
      const modules = [createModule(PAGES_MODULE_KINDS.INFO, 0, 1)];
      renderModulesWithWrapper(modules);

      const countInput = screen.getByTestId("clone-count-input");
      fireEvent.change(countInput, { target: { value: "2" } });
      await userEvent.click(screen.getByTestId("clone-module-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("module-ids")).toHaveTextContent(
          /^temp-1,temp-clone-\d+,temp-clone-\d+$/
        );
      });

      expect(
        screen.getByTestId("text-editor-modules[0].content")
      ).toBeVisible();
      expect(
        screen.getByTestId("text-editor-modules[1].content")
      ).not.toBeVisible();
      expect(
        screen.getByTestId("text-editor-modules[2].content")
      ).not.toBeVisible();
      expect(countInput).toHaveValue(1);
    });

    describe("Document Download clone behavior", () => {
      const createDocumentModule = (overrides) => ({
        _tempId: "temp-doc-1",
        kind: PAGES_MODULE_KINDS.DOCUMENT,
        custom_order: 0,
        name: "Doc",
        description: "Desc",
        type: PAGE_MODULES_DOWNLOAD.FILE,
        external_url: "",
        file: null,
        ...overrides
      });

      test("type=File, already-uploaded file: disables Clone and does not create copies", () => {
        const modules = [
          createDocumentModule({
            file: [{ id: 10, file_url: "http://x/file.pdf" }]
          })
        ];

        const TestWrapper = () => {
          const { values } = useFormikContext();
          return (
            <>
              <PageModules name="modules" />
              <div data-testid="module-count">{values.modules.length}</div>
            </>
          );
        };

        const store = mockStore({
          mediaUploadState: { media_file_types: [] }
        });
        render(
          <Provider store={store}>
            <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
              <Form>
                <TestWrapper />
              </Form>
            </Formik>
          </Provider>
        );

        const cloneButton = screen.getByTestId("clone-module-btn");
        expect(cloneButton).toBeDisabled();

        // native `disabled` blocks the click outright; use fireEvent since
        // userEvent additionally refuses to interact with pointer-events:none
        // elements (which MUI also sets on disabled buttons)
        fireEvent.click(cloneButton);

        expect(screen.getByTestId("module-count")).toHaveTextContent("1");
      });

      test.each([
        ["file: null (default, nothing chosen yet)", { file: null }],
        ["file: [] (nothing chosen yet)", { file: [] }]
      ])(
        "type=File, no file chosen yet (%s): keeps Clone enabled and clones normally",
        async (_description, moduleOverrides) => {
          const modules = [createDocumentModule(moduleOverrides)];

          const TestWrapper = () => {
            const { values } = useFormikContext();
            return (
              <>
                <PageModules name="modules" />
                <div data-testid="module-count">{values.modules.length}</div>
              </>
            );
          };

          const store = mockStore({
            mediaUploadState: { media_file_types: [] }
          });
          render(
            <Provider store={store}>
              <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
                <Form>
                  <TestWrapper />
                </Form>
              </Formik>
            </Provider>
          );

          const cloneButton = screen.getByTestId("clone-module-btn");
          expect(cloneButton).not.toBeDisabled();

          await userEvent.click(cloneButton);

          expect(screen.getByTestId("module-count")).toHaveTextContent("2");
        }
      );

      test.each([
        [
          "type=File, newly selected file: copies file as-is to every clone",
          { file: [{ name: "new-upload.pdf" }] },
          {
            externalUrl: "",
            file: JSON.stringify([{ name: "new-upload.pdf" }])
          }
        ],
        [
          "type=Url: copies external_url as-is and leaves file untouched",
          {
            type: PAGE_MODULES_DOWNLOAD.URL,
            external_url: "https://example.com/doc"
          },
          { externalUrl: "https://example.com/doc", file: "null" }
        ]
      ])("%s", async (_description, moduleOverrides, expected) => {
        const modules = [createDocumentModule(moduleOverrides)];

        const TestWrapper = () => {
          const { values } = useFormikContext();
          return (
            <>
              <PageModules name="modules" />
              <div data-testid="clone-external-url-1">
                {JSON.stringify(values.modules[1]?.external_url)}
              </div>
              <div data-testid="clone-file-1">
                {JSON.stringify(values.modules[1]?.file)}
              </div>
              <div data-testid="clone-file-2">
                {JSON.stringify(values.modules[2]?.file)}
              </div>
            </>
          );
        };

        const store = mockStore({
          mediaUploadState: { media_file_types: [] }
        });
        render(
          <Provider store={store}>
            <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
              <Form>
                <TestWrapper />
              </Form>
            </Formik>
          </Provider>
        );

        const countInput = screen.getByTestId("clone-count-input");
        fireEvent.change(countInput, { target: { value: "2" } });
        await userEvent.click(screen.getByTestId("clone-module-btn"));

        await waitFor(() => {
          expect(screen.getByTestId("clone-file-1")).toHaveTextContent(
            expected.file
          );
          expect(screen.getByTestId("clone-file-2")).toHaveTextContent(
            expected.file
          );
        });
        expect(screen.getByTestId("clone-external-url-1")).toHaveTextContent(
          JSON.stringify(expected.externalUrl)
        );
      });
    });
  });
});
