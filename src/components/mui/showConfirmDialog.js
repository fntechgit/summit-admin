import { createRoot } from "react-dom/client";
import React from "react";
import ConfirmDialog from "./confirm-dialog";

const showConfirmDialog = ({
  title,
  text,
  iconType = "",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonColor = "primary",
  cancelButtonColor = "primary"
}) =>
  new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const close = (answer) => {
      root.unmount();
      container.remove();
      resolve(answer);
    };

    const handleConfirm = () => close(true);
    const handleCancel = () => close(false);

    root.render(
      <ConfirmDialog
        open
        title={title}
        text={text}
        iconType={iconType}
        confirmButtonText={confirmButtonText}
        cancelButtonText={cancelButtonText}
        confirmButtonColor={confirmButtonColor}
        cancelButtonColor={cancelButtonColor}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  });

export default showConfirmDialog;
