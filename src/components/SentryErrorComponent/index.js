import React from "react";

function FallbackComponent({ componentName }) {
  return (
    <div>
      An error has occurred on <b>{componentName}</b> Component
    </div>
  );
}

export const SentryFallbackFunction = ({ componentName }) => (
  <FallbackComponent componentName={componentName} />
);
