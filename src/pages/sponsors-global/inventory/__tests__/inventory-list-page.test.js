import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import T from "i18n-react/dist/i18n-react";
import { InventoryImagePreviewCell } from "../inventory-list-page";

describe("InventoryListPage", () => {
  describe("InventoryImagePreviewCell", () => {
    const imageUrl = "https://example.com/image.png";
    const previewAlt = T.translate("inventory_item_list.image_preview_alt");
    const previewActionAlt = T.translate(
      "inventory_item_list.image_preview_action_alt"
    );
    const previewUnavailable = T.translate(
      "inventory_item_list.image_preview_unavailable"
    );

    beforeEach(() => {
      jest.restoreAllMocks();
    });

    test("opens preview on hover/focus and closes on leave/blur", async () => {
      const user = userEvent.setup();

      render(<InventoryImagePreviewCell imageUrl={imageUrl} />);

      const button = screen.getByRole("button");

      await user.hover(button);
      await waitFor(() => {
        expect(screen.getByAltText(previewAlt)).toBeInTheDocument();
      });

      await user.unhover(button);
      await waitFor(() => {
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
      });

      button.focus();
      await waitFor(() => {
        expect(screen.getByAltText(previewAlt)).toBeInTheDocument();
      });

      button.blur();
      await waitFor(() => {
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
      });
    });

    test("does not render when imageUrl is null or empty", () => {
      const { rerender } = render(
        <InventoryImagePreviewCell imageUrl={null} />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();

      rerender(<InventoryImagePreviewCell imageUrl="" />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    test("sets explicit aria-label for accessibility", () => {
      render(<InventoryImagePreviewCell imageUrl={imageUrl} />);

      expect(
        screen.getByRole("button", { name: previewActionAlt })
      ).toBeInTheDocument();
    });

    test("shows fallback text if image fails to load", async () => {
      const user = userEvent.setup();

      render(<InventoryImagePreviewCell imageUrl={imageUrl} />);

      const button = screen.getByRole("button");
      await user.hover(button);

      const image = screen.getByAltText(previewAlt);
      fireEvent.error(image);

      expect(screen.getByText(previewUnavailable)).toBeInTheDocument();
    });

    test("keeps click action while preview is visible", async () => {
      const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
      const user = userEvent.setup();

      render(<InventoryImagePreviewCell imageUrl={imageUrl} />);

      const button = screen.getByRole("button");
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByAltText(previewAlt)).toBeInTheDocument();
      });

      await user.click(button);

      expect(openSpy).toHaveBeenCalledWith(
        imageUrl,
        "_blank",
        "noopener,noreferrer"
      );
    });
  });
});
