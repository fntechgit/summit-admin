import React from "react";
import T from "i18n-react";
import { IconButton } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import MuiTable from "../../../../components/mui/table/mui-table";
import ChipList from "../../../../components/mui/chip-list";
import { titleCase } from "../../../../utils/methods";

const UsersTable = ({
  sponsorId = null,
  users,
  term,
  onEdit,
  getUsers,
  deleteSponsorUser
}) => {
  const handleUserDelete = (userId) => {
    deleteSponsorUser(sponsorId, userId).then(() => {
      getUsers(sponsorId);
    });
  };

  const handleSendEmail = (item) => {
    console.log("SEND EMAIL", item);
  };

  const handleUsersPageChange = (page) => {
    const { perPage, order, orderDir } = users;
    getUsers(sponsorId, term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    const { order, orderDir } = users;
    getUsers(term, 1, newPerPage, order, orderDir);
  };

  const handleUsersSort = (key, dir) => {
    const { currentPage, perPage } = users;
    getUsers(sponsorId, term, currentPage, perPage, key, dir);
  };

  let usersColumns = [
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
      columnKey: "sponsors",
      header: T.translate("sponsor_users.sponsor"),
      sortable: false,
      render: (row) => row.sponsors_str.map((s) => <div>{s}</div>)
    },
    {
      columnKey: "access_rights_str",
      header: T.translate("sponsor_users.access"),
      sortable: false,
      render: (row) => <ChipList chips={row.access_rights_str} maxLength={2} />
    },
    {
      columnKey: "is_active",
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

  // remove sponsor col if is a sponsor list
  if (sponsorId) {
    usersColumns = usersColumns.filter((col) => col.columnKey !== "sponsors");
  }

  const usersTableOptions = {
    sortCol: users.order,
    sortDir: users.orderDir
  };

  const userData = users.items.map((u) => {
    const sponsorAccessRights = u.access_rights.filter(
      (ar) => !sponsorId || ar.sponsor_id === sponsorId
    );

    const accessRights = sponsorAccessRights.reduce((res, it) => {
      it.groups?.forEach((group) => {
        if (!res.find((g) => g.id === group.id))
          res.push({ name: titleCase(group.name), id: group.id });
      });
      return res;
    }, []);

    const sponsors = sponsorAccessRights.reduce(
      (res, it) => [...new Set([...res, it.sponsor.company_name])],
      []
    );

    return {
      ...u,
      access_rights: sponsorAccessRights,
      access_rights_str: accessRights.map((a) => a.name),
      access_rights_id: accessRights.map((a) => a.id),
      sponsors_str: sponsors
    };
  });

  return (
    users.items.length > 0 && (
      <div>
        <MuiTable
          columns={usersColumns}
          data={userData}
          options={usersTableOptions}
          perPage={users.perPage}
          totalRows={users.totalCount}
          currentPage={users.currentPage}
          getName={(user) => user.email}
          onEdit={onEdit}
          onDelete={handleUserDelete}
          deleteDialogBody={(user) =>
            T.translate("edit_sponsor.remove_sponsor_user_warning", { user })
          }
          onPageChange={handleUsersPageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleUsersSort}
        />
      </div>
    )
  );
};

export default UsersTable;
