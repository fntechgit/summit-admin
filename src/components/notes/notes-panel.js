import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react";
import { FormikProvider, useFormik } from "formik";
import {
  Box,
  Button,
  Divider,
  Grid2,
  InputLabel,
  Link,
  Typography
} from "@mui/material";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiForm from "openstack-uicore-foundation/lib/components/mui/form";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import CollapsibleSection from "../mui/collapsible-section";
import {
  clearNotesParams,
  getNotes,
  exportNotes,
  saveNote,
  deleteNote
} from "../../actions/notes-actions";
import {
  DEFAULT_CURRENT_PAGE,
  TEXT_MAX_LENGTH_1024
} from "../../utils/constants";

const NotesPanel = ({
  attendeeId,
  ticketId,
  open,
  onToggle,
  onOpen,
  currentSummit,
  notes,
  currentPage,
  perPage,
  totalNotes,
  order,
  orderDir,
  columns,
  getNotes,
  exportNotes,
  saveNote,
  deleteNote,
  clearNotesParams
}) => {
  const [term, setTerm] = useState("");

  useEffect(() => {
    getNotes(
      attendeeId,
      ticketId,
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir
    )
      .then(() => onOpen())
      .catch(() => {});

    return () => {
      clearNotesParams();
    };
  }, []);

  const fetchNotes = (newTerm, page, newPerPage, newOrder, newOrderDir) =>
    getNotes(
      attendeeId,
      ticketId,
      newTerm,
      page,
      newPerPage,
      newOrder,
      newOrderDir
    ).catch(() => {});

  const formik = useFormik({
    initialValues: { content: "" },
    onSubmit: ({ content }, { resetForm }) =>
      saveNote(attendeeId, ticketId, content)
        .then(() => {
          resetForm();
          return fetchNotes(
            term,
            DEFAULT_CURRENT_PAGE,
            perPage,
            order,
            orderDir
          );
        })
        .catch(() => {})
  });

  const handleSearch = (newTerm) => {
    setTerm(newTerm);
    fetchNotes(newTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handleSort = (key, dir) =>
    fetchNotes(term, DEFAULT_CURRENT_PAGE, perPage, key, dir);

  const handlePageChange = (page) =>
    fetchNotes(term, page, perPage, order, orderDir);

  const handlePerPageChange = (newPerPage) =>
    fetchNotes(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);

  const handleExport = () =>
    exportNotes(attendeeId, ticketId, term, order, orderDir);

  const handleDelete = (noteId) =>
    deleteNote(attendeeId, noteId)
      .then(() =>
        fetchNotes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
      )
      .catch(() => {});

  const tableColumns = [
    { columnKey: "id", header: T.translate("notes_panel.id"), sortable: true },
    {
      columnKey: "created",
      header: T.translate("notes_panel.created"),
      sortable: true
    },
    {
      columnKey: "author_fullname",
      header: T.translate("notes_panel.author_fullname"),
      sortable: true
    },
    {
      columnKey: "author_email",
      header: T.translate("notes_panel.author_email"),
      sortable: true
    },
    {
      columnKey: "ticket_link",
      header: T.translate("notes_panel.ticket_id"),
      render: ({ ticket }) =>
        ticket ? (
          <Link
            href={`/app/summits/${currentSummit.id}/purchase-orders/${ticket.order_id}/tickets/${ticket.id}`}
          >
            {ticket.id}
          </Link>
        ) : (
          "-"
        )
    },
    { columnKey: "content", header: T.translate("notes_panel.content") }
  ];

  const showColumns = columns
    ? tableColumns.filter((c) => columns.includes(c.columnKey))
    : tableColumns;

  return (
    <CollapsibleSection
      title={T.translate("notes_panel.title")}
      expanded={open}
      onToggle={onToggle}
    >
      <FormikProvider value={formik}>
        <MuiForm onSubmit={formik.handleSubmit} noValidate autoComplete="off">
          <InputLabel htmlFor="new_note" sx={{ fontWeight: "bold" }}>
            {T.translate("notes_panel.add_new_note")}
          </InputLabel>
          <Box sx={{ display: "flex", alignItems: "stretch", gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <MuiFormikTextField
                id="new_note"
                name="content"
                multiline
                rows={3}
                margin="none"
                fullWidth
                maxLength={TEXT_MAX_LENGTH_1024}
              />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Button
                type="submit"
                variant="contained"
                sx={{ flex: 1 }}
                disabled={!formik.values.content.trim() || formik.isSubmitting}
              >
                {T.translate("general.add")}
              </Button>
              {/* same size as the char count line, so the button ends with the box */}
              <Typography aria-hidden sx={{ fontSize: "0.75rem" }}>
                &nbsp;
              </Typography>
            </Box>
          </Box>
        </MuiForm>
      </FormikProvider>

      <Divider sx={{ my: 2 }} />

      <Grid2
        container
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Grid2 size={{ xs: 12, md: 6 }}>
          <SearchInput
            term={term}
            placeholder={T.translate("notes_panel.placeholders.search")}
            onSearch={handleSearch}
          />
        </Grid2>
        <Button variant="contained" onClick={handleExport}>
          {T.translate("general.export")}
        </Button>
      </Grid2>

      {notes.length === 0 ? (
        <div>{T.translate("notes_panel.no_entries")}</div>
      ) : (
        <MuiTable
          columns={showColumns}
          data={notes}
          options={{ sortCol: order, sortDir: orderDir }}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalNotes}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onDelete={handleDelete}
          getName={(note) => note.id}
          deleteDialogBody={(noteId) =>
            `${T.translate("notes_panel.remove_warning")} ${noteId}`
          }
        />
      )}
    </CollapsibleSection>
  );
};

const mapStateToProps = ({ currentSummitState, notesState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...notesState
});

export default connect(mapStateToProps, {
  getNotes,
  exportNotes,
  saveNote,
  deleteNote,
  clearNotesParams
})(NotesPanel);
