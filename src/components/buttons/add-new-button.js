import React from "react";

function AddNewButton({ entity }) {
  if (!entity?.id) return null;

  return (
    <a href="new" className="btn btn-default pull-right">
      Add new
    </a>
  );
}

export default AddNewButton;
