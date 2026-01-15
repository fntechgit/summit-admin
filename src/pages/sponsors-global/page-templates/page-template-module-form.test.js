import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form, useFormikContext } from "formik";
import "@testing-library/jest-dom";
import PageModules from "./page-template-modules-form";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";
import {
  PAGES_MODULE_KINDS,
  PAGE_MODULES_MEDIA_TYPES
} from "../../../utils/constants";

// Mocks
jest.mock("../../../components/mui/showConfirmDialog", () => jest.fn());

jest.mock(
  "../../../components/inputs/formik-text-editor",
  () =>
    function MockFormikTextEditor({ name }) {
      return <textarea data-testid={`text-editor-${name}`} />;
    }
);

jest.mock(
  "../../../components/mui/formik-inputs/mui-formik-upload",
  () =>
    function MockMuiFormikUpload({ name }) {
      return <div data-testid={`upload-${name}`}>Upload</div>;
    }
);

jest.mock(
  "../../../components/mui/formik-inputs/mui-formik-textfield",
  () =>
    function MockMuiFormikTextField({ name }) {
      return <input data-testid={`textfield-${name}`} />;
    }
);

jest.mock(
  "../../../components/mui/formik-inputs/mui-formik-select",
  () =>
    function MockMuiFormikSelect({ name, children }) {
      return <select data-testid={`select-${name}`}>{children}</select>;
    }
);

jest.mock(
  "../../../components/mui/formik-inputs/mui-formik-datepicker",
  () =>
    function MockMuiFormikDatepicker({ name }) {
      return <input data-testid={`datepicker-${name}`} type="date" />;
    }
);

jest.mock(
  "../../../components/mui/formik-inputs/mui-formik-radio-group",
  () =>
    function MockMuiFormikRadioGroup({ name }) {
      return <div data-testid={`radio-group-${name}`} />;
    }
);

// Mock DragAndDropList que captura onReorder
let capturedOnReorder = null;
jest.mock(
  "../../../components/mui/dnd-list",
  () =>
    function MockDragAndDropList({ items, renderItem, onReorder }) {
      capturedOnReorder = onReorder;
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

// Helper function to render the component with Formik
const renderWithFormik = (initialValues = { modules: [] }) =>
  render(
    <Formik initialValues={initialValues} onSubmit={jest.fn()}>
      <Form>
        <PageModules name="modules" />
      </Form>
    </Formik>
  );

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

  describe("Module ordering", () => {
    test("renders modules in the order they appear in the array", () => {
      const modules = [
        createModule(PAGES_MODULE_KINDS.INFO, 0, 1),
        createModule(PAGES_MODULE_KINDS.DOCUMENT, 1, 2),
        createModule(PAGES_MODULE_KINDS.MEDIA, 2, 3)
      ];

      renderWithFormik({ modules });

      expect(
        screen.getByTestId("text-editor-modules[0].content")
      ).toBeInTheDocument();
      expect(screen.getByTestId("upload-modules[1].file")).toBeInTheDocument();
      expect(
        screen.getByTestId("datepicker-modules[2].upload_deadline")
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

      render(
        <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper />
          </Form>
        </Formik>
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

      render(
        <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper />
          </Form>
        </Formik>
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

      render(
        <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper />
          </Form>
        </Formik>
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

      await userEvent.click(accordionSummary);

      await waitFor(() => {
        expect(
          screen.getByTestId("text-editor-modules[0].content")
        ).not.toBeVisible();
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

      // close first module
      await userEvent.click(firstAccordionSummary);

      await waitFor(() => {
        // first module should be closed
        expect(
          screen.getByTestId("text-editor-modules[0].content")
        ).not.toBeVisible();
        // second module should be expanded
        expect(screen.getByTestId("upload-modules[1].file")).toBeVisible();
      });
    });
  });

  describe("handleDeleteModule", () => {
    test("shows confirmation dialog when delete button is clicked", async () => {
      showConfirmDialog.mockResolvedValue(false);

      const modules = [createModule(PAGES_MODULE_KINDS.INFO, 0, 1)];
      renderWithFormik({ modules });

      const deleteButton = screen.getByTestId("DeleteIcon").closest("button");
      await userEvent.click(deleteButton);

      expect(showConfirmDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "general.are_you_sure",
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

      render(
        <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper />
          </Form>
        </Formik>
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

      render(
        <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper />
          </Form>
        </Formik>
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

      render(
        <Formik initialValues={{ modules }} onSubmit={jest.fn()}>
          <Form>
            <TestWrapper />
          </Form>
        </Formik>
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
});
