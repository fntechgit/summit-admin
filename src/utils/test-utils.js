// src/utils/test-utils.js
import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { CODE_200 } from "./constants";

// Setup mock store with middleware
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Add global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    headers: new Headers(),
    status: CODE_200,
    statusText: "OK"
  })
);

/**
 * Utility function to mock fetch responses
 * @param {Object|Array|string} mockResponse - The data to be returned
 * @param {Object} options - Additional options for the mock response
 * @param {number} options.status - HTTP status code
 * @param {boolean} options.ok - Whether the request was successful
 */
export function mockFetchResponse(
  mockResponse,
  { status = CODE_200, ok = true } = {}
) {
  global.fetch.mockImplementationOnce(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(mockResponse),
      text: () =>
        Promise.resolve(
          typeof mockResponse === "string"
            ? mockResponse
            : JSON.stringify(mockResponse)
        ),
      status,
      headers: new Headers(),
      statusText: ok ? "OK" : "Error"
    })
  );
}

/**
 * Reset all fetch mocks and implementations
 */
export function resetFetchMocks() {
  global.fetch.mockReset();
}

/**
 * Custom render function for Redux components
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Rendering options
 * @param {Object} options.initialState - Initial Redux state
 * @param {Object} options.store - Custom Redux store (optional)
 * @param {Object} options.renderOptions - Additional options to pass to render
 * @returns {Object} An object with the rendering result and a store
 */
export function renderWithRedux(
  ui,
  { initialState = {}, store = mockStore(initialState), ...renderOptions } = {}
) {
  // Add mock functions for dispatch and getState
  store.dispatch = jest.fn(store.dispatch);

  const Wrapper = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store
  };
}

/**
 * Helper function to find a button by icon data-testid
 * @param {Array} buttons - Array of button elements
 * @param {string} iconTestId - The data-testid of the icon
 * @returns {HTMLElement|undefined} The button element or undefined
 */
export function findButtonByIcon(buttons, iconTestId) {
  return buttons.find((button) =>
    button.querySelector(`svg[data-testid="${iconTestId}"]`)
  );
}

/**
 * Create a mock user for testing
 * @param {Object} overrides - Properties to override in the mock user
 * @returns {Object} A mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    id: 123,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    is_active: true,
    sponsors_str: ["Acme Corp"],
    access_rights: [
      {
        id: 1,
        sponsor: { id: 42, company_name: "Acme Corp" },
        groups: [
          { id: 100, name: "admin" },
          { id: 101, name: "viewer" }
        ]
      }
    ],
    ...overrides
  };
}

/**
 * Create mock summit data for testing
 * @param {Object} overrides - Properties to override in the mock summit
 * @returns {Object} A mock summit object
 */
export function createMockSummit(overrides = {}) {
  return {
    id: 456,
    name: "Test Summit 2023",
    ...overrides
  };
}

/**
 * Create mock user groups for testing
 * @returns {Array} An array of mock user group objects
 */
export function createMockUserGroups() {
  return [
    { id: 100, name: "admin" },
    { id: 101, name: "viewer" },
    { id: 102, name: "contributor" }
  ];
}
