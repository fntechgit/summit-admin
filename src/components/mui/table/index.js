import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import showConfirmDialog from "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog";
import EditIcon from "@mui/icons-material/Edit";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RowActions from "./row-actions";

const BUTTON_SLOT_WIDTH = 44;
const COLUMN_PADDING = 16;

/**
 * Wrapper around uicore's MuiTable that owns the row-action layout.
 *
 * uicore renders Edit, Archive, Delete and Select as four separate icon cells,
 * which puts the destructive action between two safe ones. This forwards none
 * of those props to uicore and appends its own trailing column instead, so the
 * row reads `edit / select / overflow` with Delete inside the overflow menu.
 *
 * The prop contract is uicore's, unchanged: pages keep passing `onEdit`,
 * `onDelete`, `onSelect`, `canDelete`, `deleteDialogBody` and friends exactly
 * as before, and only swap their import. That keeps the arrangement in one
 * file for every table, and makes this trivial to delete if uicore adopts it.
 */
const Table = ({
  columns,
  onEdit,
  onArchive,
  onDelete,
  onSelect,
  canDelete,
  getName,
  deleteDialogTitle,
  deleteDialogBody,
  deleteDialogConfirmText,
  confirmButtonColor,
  options,
  ...rest
}) => {
  const { disableProp } = options;

  const isRowDisabled = (row) => Boolean(disableProp && row[disableProp]);

  const confirmAndDelete = async (row) => {
    const name = getName(row);
    const body =
      typeof deleteDialogBody === "function"
        ? deleteDialogBody(name)
        : deleteDialogBody;

    const isConfirmed = await showConfirmDialog({
      title: deleteDialogTitle || T.translate("general.are_you_sure"),
      text: body || `${T.translate("general.row_remove_warning")} ${name}`,
      iconType: "warning",
      confirmButtonColor: confirmButtonColor || "error",
      confirmButtonText:
        deleteDialogConfirmText || T.translate("general.yes_delete")
    });

    // uicore hands the row id to onDelete, not the row — keep that contract.
    if (isConfirmed) onDelete(row.id);
  };

  const buildInlineActions = (row) =>
    [
      onEdit && {
        key: "edit",
        label: T.translate("general.edit"),
        icon: EditIcon,
        disabled: isRowDisabled(row),
        onClick: () => onEdit(row)
      },
      onArchive && {
        key: "archive",
        label: row.is_archived
          ? T.translate("general.unarchive")
          : T.translate("general.archive"),
        icon: row.is_archived ? UnarchiveIcon : ArchiveIcon,
        disabled: disableProp !== "is_archived" && isRowDisabled(row),
        onClick: () => onArchive(row)
      },
      onSelect && {
        key: "select",
        label: T.translate("general.select"),
        icon: ArrowForwardIcon,
        disabled: isRowDisabled(row),
        onClick: () => onSelect(row)
      }
    ].filter(Boolean);

  const buildMenuActions = (row) =>
    [
      onDelete &&
        canDelete(row) && {
          key: "delete",
          label: T.translate("general.delete"),
          destructive: true,
          disabled: isRowDisabled(row),
          onClick: () => confirmAndDelete(row)
        }
    ].filter(Boolean);

  const hasActions = Boolean(onEdit || onArchive || onDelete || onSelect);

  // Width is static, so size it from the actions the table was given rather
  // than the ones a particular row happens to show.
  const slotCount =
    [onEdit, onArchive, onSelect].filter(Boolean).length + (onDelete ? 1 : 0);

  const actionsColumn = {
    columnKey: "row-actions",
    header: "",
    align: "right",
    width: slotCount * BUTTON_SLOT_WIDTH + COLUMN_PADDING,
    render: (row) => (
      <RowActions
        rowId={row.id}
        inlineActions={buildInlineActions(row)}
        menuActions={buildMenuActions(row)}
      />
    )
  };

  return (
    <MuiTable
      {...rest}
      options={options}
      columns={hasActions ? [...columns, actionsColumn] : columns}
    />
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  onEdit: PropTypes.func,
  onArchive: PropTypes.func,
  onDelete: PropTypes.func,
  onSelect: PropTypes.func,
  canDelete: PropTypes.func,
  getName: PropTypes.func,
  deleteDialogTitle: PropTypes.string,
  deleteDialogBody: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  deleteDialogConfirmText: PropTypes.string,
  confirmButtonColor: PropTypes.string,
  options: PropTypes.shape({ disableProp: PropTypes.string })
};

Table.defaultProps = {
  onEdit: undefined,
  onArchive: undefined,
  onDelete: undefined,
  onSelect: undefined,
  canDelete: () => true,
  getName: (row) => row.name,
  deleteDialogTitle: null,
  deleteDialogBody: null,
  deleteDialogConfirmText: null,
  confirmButtonColor: null,
  options: {}
};

export default Table;
