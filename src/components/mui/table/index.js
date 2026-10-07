import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
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
 * Wraps uicore's MuiTable to own the row actions: Delete in a leading overflow
 * menu, edit / archive / select as trailing icons. Takes uicore's props
 * unchanged, plus `onRowClick`, which uicore rows lack.
 */
const Table = ({
  columns,
  data,
  tableSx,
  onRowClick,
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

  // Size from the table's actions, not each row's, so the width stays fixed.
  const slotCount = [onEdit, onArchive, onSelect].filter(Boolean).length;

  const menuColumn = {
    columnKey: "row-menu",
    header: "",
    width: BUTTON_SLOT_WIDTH + COLUMN_PADDING,
    render: (row) => (
      <RowActions rowId={row.id} menuActions={buildMenuActions(row)} />
    )
  };

  const actionsColumn = {
    columnKey: "row-actions",
    header: "",
    align: "right",
    width: slotCount * BUTTON_SLOT_WIDTH + COLUMN_PADDING,
    render: (row) => (
      <RowActions rowId={row.id} inlineActions={buildInlineActions(row)} />
    )
  };

  const handleRowClick = (ev) => {
    const tr = ev.target.closest("tbody tr");
    const row = tr && data[tr.sectionRowIndex];
    if (row && !isRowDisabled(row)) onRowClick(row);
  };

  // Only data rows; empty-state and extra rows follow them in tbody.
  const rowHoverSx = {
    [`& tbody tr:nth-of-type(-n+${data.length}):hover`]: {
      cursor: "pointer",
      bgcolor: "action.hover"
    }
  };

  return (
    <Box onClick={onRowClick ? handleRowClick : undefined}>
      <MuiTable
        {...rest}
        data={data}
        options={options}
        tableSx={onRowClick ? { ...tableSx, ...rowHoverSx } : tableSx}
        columns={[
          ...(onDelete ? [menuColumn] : []),
          ...columns,
          ...(slotCount ? [actionsColumn] : [])
        ]}
      />
    </Box>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({})),
  tableSx: PropTypes.shape({}),
  onRowClick: PropTypes.func,
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
  data: [],
  tableSx: {},
  onRowClick: undefined,
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
