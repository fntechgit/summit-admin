import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ExpandText from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const readMore = () =>
  screen.queryByRole("button", { name: "general.read_more" });
const readLess = () =>
  screen.queryByRole("button", { name: "general.read_less" });

// jsdom does no layout, so fake whether the clamped box overflows
const mockOverflow = (overflowing) => {
  jest
    .spyOn(HTMLElement.prototype, "scrollHeight", "get")
    .mockReturnValue(overflowing ? 100 : 40);
  jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(40);
};

describe("ExpandText", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("line mode (default)", () => {
    it("clamps to 2 lines by default", () => {
      mockOverflow(false);
      render(<ExpandText>some text</ExpandText>);

      expect(screen.getByText("some text")).toHaveStyle({
        overflow: "hidden",
        "-webkit-line-clamp": "2"
      });
    });

    it("clamps to the given number of lines", () => {
      mockOverflow(false);
      render(<ExpandText lines={3}>some text</ExpandText>);

      expect(screen.getByText("some text")).toHaveStyle({
        "-webkit-line-clamp": "3"
      });
    });

    it("shows no toggle when the text fits", () => {
      mockOverflow(false);
      render(<ExpandText>short text</ExpandText>);

      expect(readMore()).not.toBeInTheDocument();
      expect(readLess()).not.toBeInTheDocument();
    });

    it("toggles between read more and read less when the text is clamped", async () => {
      mockOverflow(true);
      render(<ExpandText>long text</ExpandText>);

      await userEvent.click(readMore());
      expect(screen.getByText("long text")).not.toHaveStyle({
        overflow: "hidden"
      });
      expect(readLess()).toBeInTheDocument();

      await userEvent.click(readLess());
      expect(screen.getByText("long text")).toHaveStyle({ overflow: "hidden" });
      expect(readMore()).toBeInTheDocument();
    });
  });

  describe("character mode (charCount)", () => {
    it("renders the full text and no toggle when within charCount", () => {
      render(<ExpandText charCount={20}>short text</ExpandText>);

      expect(screen.getByText("short text")).toBeInTheDocument();
      expect(readMore()).not.toBeInTheDocument();
    });

    it("caps the text at charCount and toggles between read more and read less", async () => {
      render(<ExpandText charCount={5}>Hello World</ExpandText>);

      expect(screen.getByText(/^Hello\.\.\./)).toBeInTheDocument();
      expect(screen.queryByText(/World/)).not.toBeInTheDocument();

      await userEvent.click(readMore());
      expect(screen.getByText(/Hello World/)).toBeInTheDocument();

      await userEvent.click(readLess());
      expect(screen.getByText(/^Hello\.\.\./)).toBeInTheDocument();
      expect(readMore()).toBeInTheDocument();
    });
  });

  it("does not propagate the toggle click to parent handlers", async () => {
    const onParentClick = jest.fn();
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={onParentClick}>
        <ExpandText charCount={5}>Hello World</ExpandText>
      </div>
    );

    await userEvent.click(readMore());

    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("renders nothing for empty content", () => {
    const { container } = render(<ExpandText charCount={5} />);

    expect(container).toHaveTextContent("");
  });
});
