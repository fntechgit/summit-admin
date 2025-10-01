import React, { useState } from "react";
import T from "i18n-react";
import { IconButton } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MuiTable from "../../../../components/mui/table/mui-table";
import ProcessRequestPopup from "./process-request-popup";

const RequestTable = ({ requests, term, getRequests, onRequestDelete }) => {
  const [processRequest, setProcessRequest] = useState(null);

  const handleRequestsPageChange = (page) => {
    const { perPage, order, orderDir } = requests;
    getRequests(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    const { order, orderDir } = requests;
    getRequests(term, 1, newPerPage, order, orderDir);
  };

  const handleRequestsSort = (key, dir) => {
    const { currentPage, perPage } = requests;
    getRequests(term, currentPage, perPage, key, dir);
  };

  const handleProcessRequest = (row) => {
    setProcessRequest(row);
  };

  const handleRequestDelete = (itemId) => {
    onRequestDelete(itemId).then(() => {
      getRequests();
    });
  };

  const requestsColumns = [
    {
      columnKey: "requester_first_name",
      header: T.translate("sponsor_users.name"),
      sortable: true
    },
    {
      columnKey: "requester_email",
      header: T.translate("sponsor_users.email"),
      sortable: true
    },
    {
      columnKey: "company_name",
      header: T.translate("sponsor_users.sponsor"),
      sortable: true
    },
    {
      columnKey: "created",
      header: T.translate("sponsor_users.request_time"),
      sortable: true
    },
    {
      columnKey: "process",
      header: "",
      width: 100,
      align: "center",
      render: (row) => (
        <IconButton size="large" onClick={() => handleProcessRequest(row)}>
          <ArrowForwardIcon fontSize="large" />
        </IconButton>
      ),
      dottedBorder: true
    }
  ];

  const requestsTableOptions = {
    sortCol: requests.order,
    sortDir: requests.orderDir
  };

  return (
    requests.items.length > 0 && (
      <div>
        <MuiTable
          columns={requestsColumns}
          data={requests.items}
          options={requestsTableOptions}
          perPage={requests.perPage}
          totalRows={requests.totalCount}
          currentPage={requests.currentPage}
          onDelete={handleRequestDelete}
          onPageChange={handleRequestsPageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleRequestsSort}
          deleteDialogTitle={T.translate(
            "sponsor_users.process_request.delete_confirmation_title"
          )}
          deleteDialogBody={T.translate(
            "sponsor_users.process_request.delete_confirmation_body"
          )}
        />

        {processRequest && (
          <ProcessRequestPopup
            request={processRequest}
            onClose={() => setProcessRequest(null)}
          />
        )}
      </div>
    )
  );
};

export default RequestTable;
