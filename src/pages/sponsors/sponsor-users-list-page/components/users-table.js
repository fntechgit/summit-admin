import React from "react";
import T from "i18n-react";
import { IconButton } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import MuiTable from "../../../../components/mui/table/mui-table";
import ChipList from "../../../../components/mui/chip-list";

const UsersTable = ({ users, term, getUsers }) => {
  const handleUserDelete = (itemId) => {
    console.log("DELETE", itemId);
  };

  const handleSendEmail = (item) => {
    console.log("SEND EMAIL", item);
  };

  const handleUsersPageChange = (page) => {
    const { perPage, order, orderDir } = users;
    getUsers(null, term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    const { order, orderDir } = users;
    getUsers(term, 1, newPerPage, order, orderDir);
  };

  const handleUsersSort = (key, dir) => {
    const { currentPage, perPage } = users;
    getUsers(null, term, currentPage, perPage, key, dir);
  };

  const usersColumns = [
    {
      columnKey: "first_name",
      header: T.translate("sponsor_users.name"),
      sortable: true
    },
    {
      columnKey: "email",
      header: T.translate("sponsor_users.email"),
      sortable: true
    },
    {
      columnKey: "company_name",
      header: T.translate("sponsor_users.sponsor"),
      sortable: true
    },
    {
      columnKey: "access_rights",
      header: T.translate("sponsor_users.access"),
      sortable: false,
      render: (row) => <ChipList chips={row.access_rights} maxLength={2} />
    },
    {
      columnKey: "active",
      header: T.translate("sponsor_users.active"),
      sortable: false
    },
    {
      columnKey: "send_email",
      header: "",
      width: 100,
      align: "center",
      render: (row) => (
        <IconButton size="large" onClick={() => handleSendEmail(row)}>
          <MailOutlineIcon fontSize="large" />
        </IconButton>
      ),
      dottedBorder: true
    }
  ];

  const usersTableOptions = {
    sortCol: users.order,
    sortDir: users.orderDir
  };

  return (
    users.items.length > 0 && (
      <div>
        <MuiTable
          columns={usersColumns}
          data={users.items}
          options={usersTableOptions}
          perPage={users.perPage}
          totalRows={users.totalCount}
          currentPage={users.currentPage}
          onDelete={handleUserDelete}
          onPageChange={handleUsersPageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleUsersSort}
        />
      </div>
    )
  );
};

export default UsersTable;
