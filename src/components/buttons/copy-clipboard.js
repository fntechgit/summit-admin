import React from "react";

const CopyClipboard = ({ toClipboard }) => {
  if (!toClipboard) return null;

  return (
    <>
      &nbsp;
      <i
        className="copy-button fa fa-clipboard"
        onClick={() => {
          navigator.clipboard.writeText(toClipboard);
        }}
        title="Copy to clipboard"
      />
    </>
  );
};

export default CopyClipboard;
