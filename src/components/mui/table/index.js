import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import showConfirmDialog from "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RowActions from "./row-actions";

const BUTTON_SLOT_WIDTH = 44;
const COLUMN_PADDING = 16;

/**
 * Wraps uicore's MuiTable: Delete in a leading overflow menu, select as a
 * trailing icon, and an optional row click, which uicore rows lack.
 */
const Table = ({
  columns,
  data,
  tableSx,
  onRowClick,
  onDelete,
  onSelect,
  deleteDialogBody,
  ...rest
}) => {
  const confirmAndDelete = async (row) => {
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: deleteDialogBody
        ? deleteDialogBody(row.name)
        : `${T.translate("general.row_remove_warning")} ${row.name}`,
      iconType: "warning",
      confirmButtonColor: "error",
      confirmButtonText: T.translate("general.yes_delete")
    });

    // uicore hands the row id to onDelete, not the row — keep that contract.
    if (isConfirmed) onDelete(row.id);
  };

  const buildInlineActions = (row) => [
    {
      key: "select",
      label: T.translate("general.select"),
      icon: ArrowForwardIcon,
      onClick: () => onSelect(row)
    }
  ];

  const buildMenuActions = (row) => [
    {
      key: "delete",
      label: T.translate("general.delete"),
      destructive: true,
      onClick: () => confirmAndDelete(row)
    }
  ];

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
    width: BUTTON_SLOT_WIDTH + COLUMN_PADDING,
    render: (row) => (
      <RowActions rowId={row.id} inlineActions={buildInlineActions(row)} />
    )
  };

  const handleRowClick = (ev) => {
    const tr = ev.target.closest("tbody tr");
    const row = tr && data[tr.sectionRowIndex];
    if (row) onRowClick(row);
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
        tableSx={onRowClick ? { ...tableSx, ...rowHoverSx } : tableSx}
        columns={[
          ...(onDelete ? [menuColumn] : []),
          ...columns,
          ...(onSelect ? [actionsColumn] : [])
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
  onDelete: PropTypes.func,
  onSelect: PropTypes.func,
  deleteDialogBody: PropTypes.func
};

Table.defaultProps = {
  data: [],
  tableSx: {},
  onRowClick: undefined,
  onDelete: undefined,
  onSelect: undefined,
  deleteDialogBody: null
};

export default Table;
