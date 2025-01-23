import React, { useEffect, useState } from "react";

const ActionsTableCell = ({ id, actions, isEdit = false }) => {
  const [isEditing, setIsEditing] = useState(isEdit);

  useEffect(() => {
    setIsEditing(isEdit);
  }, [isEdit]);

  const onDelete = (ev) => {
    ev.preventDefault();
    actions.delete(id);
  };

  const onEdit = (ev) => {
    ev.preventDefault();
    setIsEditing(true);
    actions.edit(id);
  };

  const onCancel = (ev) => {
    ev.preventDefault();
    setIsEditing(false);
    actions.cancel(id);
  };

  if (isEditing) {
    return (
      <td className="actions">
        <a href="" onClick={onCancel} data-tooltip-content="close">
          <i className="fa fa-times" />
        </a>
      </td>
    );
  }
  return (
    <td className="actions">
      {"edit" in actions && (
        <a href="" onClick={onEdit} data-tooltip-content="edit">
          <i className="fa fa-pencil-square-o" />
        </a>
      )}
      {"delete" in actions && (
        <a href="" onClick={onDelete} data-tooltip-content="delete">
          <i className="fa fa-trash-o" />
        </a>
      )}
    </td>
  );
};

export default ActionsTableCell;
