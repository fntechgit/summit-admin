// src/hooks/__tests__/usePrint.test.js
// @testing-library/react 12 (React 16) does not export renderHook; use a
// lightweight component wrapper instead.
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import usePrint from "../usePrint";

const PrintTrigger = () => {
  const print = usePrint();
  return (
    <button type="button" onClick={print}>
      print
    </button>
  );
};

describe("usePrint", () => {
  it("invokes window.print", () => {
    const printSpy = jest.spyOn(window, "print").mockImplementation(() => {});
    render(<PrintTrigger />);
    fireEvent.click(screen.getByRole("button", { name: "print" }));
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
