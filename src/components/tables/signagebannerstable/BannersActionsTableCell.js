import React from "react";

const BannersActionsTableCell = ({
  id,
  isEditing,
  disabled,
  isSaving,
  onEdit,
  onDelete,
  onSave,
  onJump,
  onCancel
}) => {
  const handleDelete = (ev) => {
    ev.preventDefault();
    onDelete(id);
  };

  const handleSave = (ev) => {
    ev.preventDefault();
    if (isSaving) return;
    onSave(id);
  };

  const handleEdit = (ev) => {
    ev.preventDefault();
    onEdit(id);
  };

  const handleCancel = (ev) => {
    ev.preventDefault();
    if (isSaving) return;
    onCancel(id);
  };

  const handleJump = (ev) => {
    ev.preventDefault();
    onJump(id);
  };

  if (disabled) return <td className="actions" />;

  if (isEditing) {
    return (
      <td className="actions">
        <a href="" onClick={handleSave} data-tooltip-content="save">
          <i className="fa fa-floppy-o" />
        </a>
        <a href="" onClick={handleCancel} data-tooltip-content="cancel">
          <i className="fa fa-times" />
        </a>
      </td>
    );
  }
  return (
    <td className="actions">
      <a href="" onClick={handleEdit} data-tooltip-content="edit">
        <i className="fa fa-pencil-square-o" />
      </a>
      <a href="" onClick={handleDelete} data-tooltip-content="delete">
        <i className="fa fa-trash-o" />
      </a>
      <a
        href=""
        onClick={handleJump}
        data-tooltip-content="jump to this banner"
      >
        <i className="fa fa-share" />
      </a>
    </td>
  );
};

export default BannersActionsTableCell;
