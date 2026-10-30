import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OverflowModal } from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../../../actions/room-occupancy-actions", () => ({
  getCurrentEventForOccupancy: jest.fn()
}));

const EVENT = { id: 9135, roomId: 5 };

const renderModal = (currentEvent) => {
  const getCurrentEventForOccupancy = jest.fn(() =>
    Promise.resolve(currentEvent)
  );
  render(
    <OverflowModal
      event={EVENT}
      show
      onHide={jest.fn()}
      onSave={jest.fn()}
      onDelete={jest.fn()}
      getCurrentEventForOccupancy={getCurrentEventForOccupancy}
    />
  );
  return getCurrentEventForOccupancy;
};

describe("OverflowModal prefill", () => {
  it("prefills with the event's overflow stream when it has one", async () => {
    const fetch = renderModal({
      ...EVENT,
      streaming_url: "https://stream.mux.com/primary123.m3u8",
      stream_is_secure: false,
      overflow_streaming_url: "https://stream.mux.com/overflow456.m3u8",
      overflow_stream_is_secure: true
    });

    expect(
      await screen.findByDisplayValue("https://stream.mux.com/overflow456.m3u8")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Is Secure ?")).toBeChecked();
    expect(fetch).toHaveBeenCalledWith(EVENT.roomId, EVENT.id);
  });

  it("falls back to the event's own stream when it has no overflow stream yet", async () => {
    renderModal({
      ...EVENT,
      streaming_url: "https://stream.mux.com/primary123.m3u8",
      stream_is_secure: true,
      overflow_streaming_url: null,
      overflow_stream_is_secure: false
    });

    expect(
      await screen.findByDisplayValue("https://stream.mux.com/primary123.m3u8")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Is Secure ?")).toBeChecked();
  });

  it("leaves the field empty when the event has no stream at all", async () => {
    renderModal({
      ...EVENT,
      streaming_url: null,
      overflow_streaming_url: null
    });

    const input = await screen.findByLabelText("Stream URL");
    expect(input).toHaveValue("");
    expect(screen.getByLabelText("Is Secure ?")).not.toBeChecked();
  });
});
