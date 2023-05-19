import React, {useState} from 'react';

const ActionsTableCell = ({id, actions}) => {
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
    
    if (isEditing) {
        return (
          <td className="actions">
              <a href="" onClick={onSave} data-tip="save" >
                  <i className="fa fa-floppy-o"/>
              </a>
              <a href="" onClick={onCancel} data-tip="cancel" >
                  <i className="fa fa-times"/>
              </a>
          </td>
        );
    } else {
        return (
          <td className="actions">
              {'edit' in actions &&
                <a href="" onClick={onEdit} data-tip="edit" >
                    <i className="fa fa-pencil-square-o"/>
                </a>
              }
              {'delete' in actions &&
                <a href="" onClick={onDelete} data-tip="delete" >
                    <i className="fa fa-trash-o"/>
                </a>
              }
          </td>
        );
    }
};

export default ActionsTableCell;
