import ReactDOM from "react-dom";
import React from "react";
import ConfirmDialog from "./confirm-dialog";

const showConfirmDialog = ({
  title,
  text,
  iconType = "warning",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonColor = "primary",
  cancelButtonColor = "default"
}) =>
  new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const close = (answer) => {
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
      resolve(answer);
    };

    const handleConfirm = () => close(true);
    const handleCancel = () => close(false);

    ReactDOM.render(
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
      />,
      container
    );
  });

export default showConfirmDialog;
