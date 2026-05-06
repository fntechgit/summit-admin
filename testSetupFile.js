import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Suppress console.error noise from known React 16 + MUI v6 incompatibilities:
//   1. DOM nesting: AccordionSummary renders as <button> and contains IconButton
//      (also <button>). This is a structural MUI pattern constraint; browsers are
//      lenient but React 16/jsdom reports it. No test assertions depend on it.
//   2. act() batching: async Formik setFieldValue calls (after awaited dialog
//      promises or direct reorder callbacks) fire outside act()'s flush window in
//      React 16. Removed in React 17 via automatic batching; tests still pass.
const originalError = console.error.bind(console);
console.error = (...args) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (
    msg.includes("cannot appear as a descendant of") ||
    msg.includes("was not wrapped in act(")
  ) {
    return;
  }
  originalError(...args);
};

// Suppress console.warn noise from third-party packages that use deprecated
// React 16 lifecycle names (componentWillMount / componentWillReceiveProps).
// react-router-dom v5 and connected-react-router trigger these on every render.
// This filter is scoped to known third-party deprecations so real warnings
// from application code still surface.
const originalWarn = console.warn.bind(console);
console.warn = (...args) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (
    msg.includes("componentWillMount has been renamed") ||
    msg.includes("componentWillReceiveProps has been renamed") ||
    msg.includes("componentWillUpdate has been renamed") ||
    msg.includes("React.createFactory() is deprecated")
  ) {
    return;
  }
  originalWarn(...args);
};

// @react-pdf/renderer >= 4 pulls ESM-only yoga-layout, which Jest in this
// project cannot parse (import.meta). Tests do not validate PDF rendering
// internals, so we provide a lightweight mock to keep test imports stable.
jest.mock("@react-pdf/renderer", () => {
  const React = require("react");
  const passthrough = ({ children }) =>
    React.createElement("div", null, children);

  return {
    __esModule: true,
    Document: passthrough,
    Page: passthrough,
    Text: passthrough,
    View: passthrough,
    Image: passthrough,
    PDFViewer: passthrough,
    PDFDownloadLink: ({ children }) =>
      typeof children === "function"
        ? children({ blob: null, url: null, loading: false, error: null })
        : children,
    BlobProvider: ({ children }) =>
      typeof children === "function"
        ? children({ blob: null, url: null, loading: false, error: null })
        : children,
    StyleSheet: { create: (styles) => styles },
    Font: { register: jest.fn() },
    pdf: jest.fn(() => ({
      updateContainer: jest.fn(),
      toBlob: () => Promise.resolve(null),
      toString: () => Promise.resolve(""),
      toBuffer: () => Promise.resolve(Buffer.from(""))
    }))
  };
});

// MUI v6 expects non-pooled synthetic events (React 17+). In this repo we
// still run React 16 in tests, so we mock the CJS lazy ripple internals used by
// ButtonBase to avoid pending ripple promises and event reuse warnings.
jest.mock("@mui/material/node/useLazyRipple", () => {
  const createRipple = () => ({
    start: jest.fn(),
    stop: jest.fn(),
    pulsate: jest.fn()
  });

  class LazyRipple {
    static use() {
      return {
        ref: { current: createRipple() },
        shouldMount: false,
        start: jest.fn(),
        stop: jest.fn(),
        pulsate: jest.fn()
      };
    }
  }

  const useLazyRipple = () => LazyRipple.use();

  return {
    __esModule: true,
    default: useLazyRipple,
    LazyRipple
  };
});
