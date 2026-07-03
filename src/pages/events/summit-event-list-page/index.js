/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import {
  GridFilter,
  useGridFilter
} from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import BulkEditTable from "openstack-uicore-foundation/lib/components/mui/bulk-edit-table";
import {
  bulkUpdateEvents,
  deleteEvent,
  exportEvents,
  getEvents,
  importEventsCSV,
  importMP4AssetsFromMUX
} from "../../../actions/event-actions";
import { getMediaUploads } from "../../../actions/media-upload-actions";
import { handleDDLSortByLabel } from "../../../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_Z_INDEX,
  HIGH_Z_INDEX,
  MAX_PER_PAGE
} from "../../../utils/constants";
import SaveFilterCriteria from "../../../components/filters/save-filter-criteria";
import SelectFilterCriteria from "../../../components/filters/select-filter-criteria";
import {
  deleteFilterCriteria,
  saveFilterCriteria
} from "../../../actions/filter-criteria-actions";
import { CONTEXT_ACTIVITIES } from "../../../utils/filter-criteria-constants";
import { buildNameIdDDL } from "../../../utils/events/summit-event-list-page.utils";
import ImportModal from "./components/ImportModal";
import ImportMUXModal from "./components/ImportMUXModal";
import {
  formatEventData,
  getCriterias,
  getOptionalColumns,
  toApiSortKey,
  toUiSortKey
} from "./helpers";

const FILTER_ID = "summit_activity_list";

const SummitEventListPage = ({
  events,
  currentSummit,
  extraColumns,
  term,
  currentPage,
  perPage,
  order,
  orderDir,
  totalEvents,
  history,
  mediaUploadTypes,
  getEvents,
  deleteEvent,
  getMediaUploads,
  exportEvents,
  importEventsCSV,
  importMP4AssetsFromMUX,
  saveFilterCriteria,
  deleteFilterCriteria,
  bulkUpdateEvents
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportFromMUXModal, setShowImportFromMUXModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(extraColumns ?? []);
  const [selectedFilterCriteria, setSelectedFilterCriteria] = useState(null);
  const { parsedFilter, resetFilters, filterValues, setFilters } =
    useGridFilter(FILTER_ID);

  // eslint-disable-next-line no-underscore-dangle
  const _getEvents = (params = {}) => {
    const mergedParams = {
      term,
      page: currentPage,
      perPage,
      order,
      orderDir,
      ...params
    };

    const {
      term: t,
      page: p,
      perPage: pp,
      order: o,
      orderDir: od
    } = mergedParams;

    getEvents(t, p, pp, o, od, parsedFilter, selectedColumns);
  };

  useEffect(() => {
    if (currentSummit) {
      getMediaUploads("", 1, MAX_PER_PAGE, "name", 1);
      getEvents();
      // GridFilter persists criteria to localStorage under a summit-agnostic
      // FILTER_ID, so it survives a summit switch unless cleared explicitly here.
      setSelectedFilterCriteria(null);
      resetFilters();
    }
  }, [currentSummit?.id]);

  useEffect(() => {
    _getEvents();
  }, [parsedFilter.join(",")]);

  useEffect(() => {
    if (selectedFilterCriteria) {
      setFilters(selectedFilterCriteria.criteria);
    } else {
      resetFilters();
    }
  }, [selectedFilterCriteria]);

  useEffect(() => {
    setSelectedColumns(extraColumns ?? []);
  }, [extraColumns]);

  const handleMUXImport = (ev) => {
    ev.preventDefault();
    setShowImportFromMUXModal(true);
  };

  const handleEdit = (row) => {
    history.push(`/app/summits/${currentSummit.id}/events/${row.id}`);
  };

  const handleExport = (ev) => {
    ev.preventDefault();
    exportEvents(term, order, orderDir, parsedFilter);
  };

  const handlePageChange = (page) => {
    _getEvents({ page });
  };

  const handlePerPageChange = (newPerPage) => {
    _getEvents({ perPage: newPerPage });
  };

  const handleSort = (index, key, dir) => {
    _getEvents({ order: toApiSortKey(key), orderDir: dir });
  };

  const handleSearch = (newTerm) => {
    _getEvents({ term: newTerm, page: DEFAULT_CURRENT_PAGE });
  };

  const handleNewEvent = () => {
    history.push(`/app/summits/${currentSummit.id}/events/new`);
  };

  const handleFilterCriteriaSave = ({ name, id, visibility }) => {
    const filterToSave = {
      id,
      show_id: currentSummit.id,
      name,
      enabled_filters: filterValues.map((f) => f.criteria),
      // only save criteria for enabled filters
      criteria: filterValues,
      context: CONTEXT_ACTIVITIES,
      visibility
    };

    saveFilterCriteria(filterToSave);
  };

  const optionalColumns = getOptionalColumns(
    currentSummit.selection_plans,
    currentSummit.tracks,
    currentSummit.event_types,
    currentSummit.id
  );

  const columnDDLOptions = [
    ...optionalColumns.map((oc) => ({ value: oc.columnKey, label: oc.label })),
    {
      value: "all_companies",
      label: T.translate("event_list.all_companies")
    },
    {
      value: "all",
      label: T.translate("general.all")
    }
  ];

  const handleColumnsChange = (ev) => {
    const { value: newColumns } = ev.target;

    if (newColumns.includes("all")) {
      setSelectedColumns(
        columnDDLOptions.map((opt) => opt.value).filter((v) => v !== "all")
      );
      return;
    }

    const allCompanies = ["submitter_company", "speaker_company", "sponsor"];
    const hadAllCompanies = selectedColumns.includes("all_companies");
    const hasAllCompanies = newColumns.includes("all_companies");

    if (hadAllCompanies && !hasAllCompanies) {
      setSelectedColumns(newColumns.filter((c) => !allCompanies.includes(c)));
      return;
    }

    if (hasAllCompanies) {
      const selectedCompanies = allCompanies.filter((c) =>
        selectedColumns.includes(c)
      ).length;
      const newCompanies = allCompanies.filter((c) =>
        newColumns.includes(c)
      ).length;

      setSelectedColumns(
        newCompanies < selectedCompanies
          ? newColumns.filter((c) => c !== "all_companies")
          : [...new Set([...newColumns, ...allCompanies])]
      );
      return;
    }

    setSelectedColumns(newColumns);
  };

  const handleFilterCriteriaChange = (filterCriteria) => {
    setSelectedFilterCriteria(filterCriteria);
  };

  const handleFilterCriteriaDelete = (filterCriteriaId) => {
    deleteFilterCriteria(filterCriteriaId).then(() => {
      setSelectedFilterCriteria(null);
    });
  };

  const eventTypeOptions = buildNameIdDDL(currentSummit.event_types);

  const fixedColumns = [
    { columnKey: "id", label: T.translate("general.id"), sortable: true },
    {
      columnKey: "type",
      label: T.translate("event_list.type"),
      sortable: true,
      // eslint-disable-next-line react/no-unstable-nested-components
      editableField: (extraProps) => (
        <Dropdown
          id="type"
          placeholder={T.translate("event_list.placeholders.event_type")}
          options={eventTypeOptions}
          value={extraProps.value}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            control: (base, state) => ({
              ...base,
              zIndex: state.menuIsOpen ? HIGH_Z_INDEX : DEFAULT_Z_INDEX
            })
          }}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...extraProps}
        />
      ),
      render: (e) => e.name
    },
    {
      columnKey: "title",
      label: T.translate("event_list.title"),
      sortable: true,
      editableField: true,
      placeholder: T.translate("bulk_actions_page.placeholders.event_title")
    },
    {
      columnKey: "selection_status",
      label: T.translate("event_list.selection_status"),
      sortable: true,
      render: (status, row) =>
        status === "unaccepted" && row.is_published === true
          ? "accepted"
          : status
    }
  ];

  const tableOptions = {
    sortCol: toUiSortKey(order),
    sortDir: orderDir
  };

  const selectedOptionalColumns = optionalColumns.filter((c) =>
    selectedColumns.includes(c.columnKey)
  );

  const tableColumns = [...fixedColumns, ...selectedOptionalColumns];

  if (!currentSummit.id) return <div />;

  const tableData = events.map((e) => formatEventData(e, currentSummit));

  return (
    <div className="container summit-event-list-filters">
      <h3>
        {T.translate("event_list.event_list")} ({totalEvents})
      </h3>
      <Grid2
        container
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={5}>
          <SearchInput
            term={term}
            placeholder={T.translate("event_list.placeholders.search_events")}
            onSearch={handleSearch}
          />
        </Grid2>
        <Grid2 size={7} sx={{ display: "flex", gap: 1, justifyContent: "end" }}>
          <GridFilter
            id={FILTER_ID}
            criterias={getCriterias(currentSummit, mediaUploadTypes)}
          />
          <Button
            variant="contained"
            onClick={handleNewEvent}
            startIcon={<AddIcon />}
          >
            {T.translate("event_list.add_event")}
          </Button>
          <Button variant="outlined" onClick={handleExport}>
            {T.translate("general.export")}
          </Button>
          <Button
            variant="outlined"
            onClick={handleMUXImport}
            sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {T.translate("event_list.mux_import")}
          </Button>
          <Button variant="outlined" onClick={() => setShowImportModal(true)}>
            {T.translate("event_list.import")}
          </Button>
        </Grid2>
      </Grid2>
      <hr />
      <div>
        <SelectFilterCriteria
          summitId={currentSummit.id}
          context={CONTEXT_ACTIVITIES}
          onDelete={handleFilterCriteriaDelete}
          selectedFilterCriteria={selectedFilterCriteria}
          onChange={handleFilterCriteriaChange}
        />
        <SaveFilterCriteria
          onSave={handleFilterCriteriaSave}
          selectedFilterCriteria={selectedFilterCriteria}
        />
      </div>

      <hr />
      <Box sx={{ mb: 2 }}>
        <MuiDropdown
          id="select_fields"
          label={T.translate("event_list.select_fields")}
          placeholder={T.translate("event_list.placeholders.select_fields")}
          value={selectedColumns}
          onChange={handleColumnsChange}
          options={handleDDLSortByLabel(columnDDLOptions)}
          multiple
        />
      </Box>

      {events.length === 0 && <div>{T.translate("event_list.no_events")}</div>}

      {events.length > 0 && (
        <div className="summit-event-list-table-wrapper">
          <BulkEditTable
            options={tableOptions}
            data={tableData}
            columns={tableColumns}
            onSort={handleSort}
            onUpdate={bulkUpdateEvents}
            totalRows={totalEvents}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onEdit={handleEdit}
            onDelete={deleteEvent}
            getName={(row) => row.title}
            deleteDialogBody={(name) =>
              `${T.translate("event_list.delete_event_warning")} ${name}`
            }
          />
        </div>
      )}

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importEventsCSV}
      />

      <ImportMUXModal
        show={showImportFromMUXModal}
        onClose={() => setShowImportFromMUXModal(false)}
        onImport={importMP4AssetsFromMUX}
      />
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentEventListState,
  mediaUploadListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  mediaUploadTypes: mediaUploadListState?.media_uploads ?? [],
  ...currentEventListState
});

export default connect(mapStateToProps, {
  getEvents,
  deleteEvent,
  exportEvents,
  importEventsCSV,
  importMP4AssetsFromMUX,
  saveFilterCriteria,
  deleteFilterCriteria,
  bulkUpdateEvents,
  getMediaUploads
})(SummitEventListPage);
