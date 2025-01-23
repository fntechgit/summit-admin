import React, { useState } from "react";

const BannersActionsTableCell = ({ id, actions }) => {
  const [isEditing, setIsEditing] = useState(false);

  const onDelete = (ev) => {
    ev.preventDefault();
    actions.delete(id);
  };

  const onSave = (ev) => {
    ev.preventDefault();
    setIsEditing(false);
    actions.save(id);
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

  const onJump = (ev) => {
    ev.preventDefault();
    actions.jump(id);
  };

  if (isEditing) {
    return (
      <td className="actions">
        <a href="" onClick={onSave} data-tooltip-content="save">
          <i className="fa fa-floppy-o" />
        </a>
        <a href="" onClick={onCancel} data-tooltip-content="cancel">
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
      {"jump" in actions && (
        <a href="" onClick={onJump} data-tooltip-content="jump to this banner">
          <i className="fa fa-share" />
        </a>
      )}
    </td>
  );
};

export default BannersActionsTableCell;
