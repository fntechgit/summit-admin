/**
 * Copyright 2019 OpenStack Foundation
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
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import moment from "moment-timezone";
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  FormHelperText,
  Grid2,
  InputLabel,
  Link,
  TextField,
  Typography
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import showConfirmDialog from "../mui/showConfirmDialog";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const BOLD_LABEL_SX = { fontWeight: "bold" };
const PRINT_EXCERPT_SIZE = { xs: 12, md: 4 };
const PRINT_HISTORY_SIZE = 12;

// access_levels and allowed_view_types can hold ids or expanded objects
const toId = (item) => (Number.isInteger(item) ? item : item?.id);

const toEpoch = (date) => (date ? date.unix() : 0);

const BadgeForm = ({
  entity,
  currentSummit,
  canPrint,
  selectedPrintType,
  badgePrints: {
    badgePrints,
    term,
    order,
    orderDir,
    currentPage,
    perPage,
    totalBadgePrints
  },
  onTypeChange,
  onSelectPrintType,
  onPrintBadge,
  onShowBadgePrints,
  onBadgePrintQuery,
  onBadgePrintExport,
  clearBadgePrints,
  onFeatureLink,
  onFeatureUnLink
}) => {
  const [showPrintDetails, setShowPrintDetails] = useState(false);
  const [viewTypeFilter, setViewTypeFilter] = useState([]);
  const [printDateFrom, setPrintDateFrom] = useState(null);
  const [printDateTo, setPrintDateTo] = useState(null);
  const [printDateError, setPrintDateError] = useState("");
  const [appliedPrintDates, setAppliedPrintDates] = useState([0, 0]);

  // a new badge type can drop view types, so keep only the ones it still offers
  useEffect(() => {
    const allowedIds = (
      currentSummit.badge_types?.find((bt) => bt.id === entity.type_id)
        ?.allowed_view_types ?? []
    ).map(toId);
    const kept = viewTypeFilter.filter((id) => allowedIds.includes(id));
    if (kept.length === viewTypeFilter.length) return;
    setViewTypeFilter(kept);
    if (showPrintDetails) {
      onBadgePrintQuery(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir, {
        viewTypeFilter: kept,
        printDateFilter: appliedPrintDates
      });
    }
  }, [entity.type_id]);

  const { badge_types: badgeTypes, badge_features: badgeFeatures } =
    currentSummit;

  if (!badgeTypes || !badgeFeatures) return null;

  const badgeType = badgeTypes.find((bt) => bt.id === entity.type_id);

  const accessLevels = badgeType.access_levels
    .map((al) =>
      currentSummit.badge_access_level_types.find((bal) => bal.id === toId(al))
    )
    .map((al) => al?.name)
    .join(", ");

  const viewTypeOptions = (badgeType.allowed_view_types ?? [])
    .map((vt) =>
      currentSummit.badge_view_types?.find((bvt) => bvt.id === toId(vt))
    )
    .filter(Boolean)
    .map((vt) => ({ label: vt.name, value: vt.id }));

  const badgeTypeOptions = badgeTypes.map((bt) => ({
    label: bt.name,
    value: bt.id
  }));

  const userTimeZone = moment.tz.guess();

  const appliedFilters = { viewTypeFilter, printDateFilter: appliedPrintDates };

  const resetPrintFilters = () => {
    setViewTypeFilter([]);
    setPrintDateFrom(null);
    setPrintDateTo(null);
    setPrintDateError("");
    setAppliedPrintDates([0, 0]);
  };

  const handleTogglePrintDetails = (ev) => {
    ev.preventDefault();
    if (!showPrintDetails) {
      resetPrintFilters();
      onShowBadgePrints();
    }
    setShowPrintDetails(!showPrintDetails);
  };

  const handleViewTypeFilterChange = (ev) => {
    const { value } = ev.target;
    setViewTypeFilter(value);
    onBadgePrintQuery(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir, {
      viewTypeFilter: value,
      printDateFilter: appliedPrintDates
    });
  };

  const handleApplyPrintFilters = () => {
    const dates = [toEpoch(printDateFrom), toEpoch(printDateTo)];
    const hasInvalidDate = [printDateFrom, printDateTo].some(
      (d) => d && !d.isValid()
    );
    if (
      hasInvalidDate ||
      (dates.every((d) => d !== 0) && dates[0] > dates[1])
    ) {
      setPrintDateError(
        T.translate("edit_ticket.print_table.badge_print_date_warning")
      );
      return;
    }
    setPrintDateError("");
    setAppliedPrintDates(dates);
    onBadgePrintQuery(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir, {
      viewTypeFilter,
      printDateFilter: dates
    });
  };

  const handleClearPrints = async () => {
    const confirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_ticket.clear_badge_prints_warning"),
      iconType: "warning",
      confirmButtonColor: "error",
      confirmButtonText: T.translate("general.clear")
    });
    if (confirmed) clearBadgePrints(entity.ticket_id).catch(() => {});
  };

  const handleFeaturesChange = (_ev, _value, reason, details) => {
    if (reason === "selectOption") {
      onFeatureLink(entity.ticket_id, details.option).catch(() => {});
    }
    if (reason === "removeOption") {
      onFeatureUnLink(entity.ticket_id, details.option.id).catch(() => {});
    }
  };

  const printExcerptRows = Object.entries(entity.print_excerpt ?? {}).map(
    ([viewType, count]) => ({ id: viewType, viewType, count })
  );

  const printExcerptColumns = [
    { columnKey: "viewType", header: T.translate("edit_ticket.type") },
    { columnKey: "count", header: T.translate("edit_ticket.count") }
  ];

  const printColumns = [
    {
      columnKey: "view_type_name",
      header: T.translate("edit_ticket.print_table.view_type_name")
    },
    {
      columnKey: "requestor_full_name",
      header: T.translate("edit_ticket.print_table.requestor_full_name"),
      sortable: true
    },
    {
      columnKey: "requestor_email",
      header: T.translate("edit_ticket.print_table.requestor_email"),
      sortable: true
    },
    {
      columnKey: "print_date",
      header: T.translate("edit_ticket.print_table.print_date"),
      sortable: true
    }
  ];

  const datePickerProps = {
    timezone: userTimeZone,
    format: "YYYY-MM-DD HH:mm",
    ampm: false,
    slotProps: {
      textField: { size: "small", fullWidth: true },
      field: { clearable: true }
    }
  };

  return (
    <Box>
      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <InputLabel htmlFor="badge_type" sx={BOLD_LABEL_SX}>
            {T.translate("edit_ticket.type")}
          </InputLabel>
          <MuiDropdown
            id="badge_type"
            size="small"
            value={entity.type_id}
            options={badgeTypeOptions}
            onChange={(ev) =>
              onTypeChange({ ...entity, type_id: ev.target.value }).catch(
                () => {}
              )
            }
          />
        </Grid2>
        <Grid2 size={12}>
          <Typography component="span" sx={BOLD_LABEL_SX}>
            {T.translate("edit_ticket.access_levels")}:
          </Typography>{" "}
          {accessLevels}
        </Grid2>
      </Grid2>

      {accessLevels.includes("IN_PERSON") && (
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          {printExcerptRows.length > 0 && (
            <Grid2
              size={showPrintDetails ? PRINT_HISTORY_SIZE : PRINT_EXCERPT_SIZE}
            >
              <InputLabel sx={BOLD_LABEL_SX}>
                {T.translate("edit_ticket.print_excerpt")}
              </InputLabel>
              {showPrintDetails ? (
                <>
                  <Grid2
                    container
                    spacing={2}
                    sx={{ alignItems: "center", mb: 2 }}
                  >
                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <SearchInput
                        term={term ?? ""}
                        placeholder={T.translate(
                          "edit_ticket.placeholders.search_badge_prints"
                        )}
                        onSearch={(newTerm) =>
                          onBadgePrintQuery(
                            newTerm,
                            DEFAULT_CURRENT_PAGE,
                            perPage,
                            order,
                            orderDir,
                            appliedFilters
                          )
                        }
                      />
                    </Grid2>
                    <Grid2
                      size={{ xs: 12, md: 6 }}
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1
                      }}
                    >
                      <Button variant="contained" onClick={onBadgePrintExport}>
                        {T.translate("general.export")}
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handleClearPrints}
                      >
                        {T.translate("general.clear")}
                      </Button>
                    </Grid2>
                  </Grid2>
                  <Grid2
                    container
                    spacing={2}
                    sx={{ alignItems: "flex-start", mb: 2 }}
                  >
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <MuiDropdown
                        id="view_type_filter"
                        size="small"
                        multiple
                        value={viewTypeFilter}
                        options={viewTypeOptions}
                        placeholder={T.translate(
                          "edit_ticket.placeholders.view_type_filter"
                        )}
                        onChange={handleViewTypeFilterChange}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 3 }}>
                      <DateTimePicker
                        {...datePickerProps}
                        label={T.translate(
                          "edit_ticket.placeholders.print_date_from"
                        )}
                        value={printDateFrom}
                        onChange={setPrintDateFrom}
                      />
                      {printDateError && (
                        <FormHelperText error>{printDateError}</FormHelperText>
                      )}
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 3 }}>
                      <DateTimePicker
                        {...datePickerProps}
                        label={T.translate(
                          "edit_ticket.placeholders.print_date_to"
                        )}
                        value={printDateTo}
                        onChange={setPrintDateTo}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleApplyPrintFilters}
                      >
                        {T.translate("edit_ticket.apply_filters")}
                      </Button>
                    </Grid2>
                  </Grid2>
                  {badgePrints.length === 0 ? (
                    <Typography>
                      {T.translate("edit_ticket.no_prints")}
                    </Typography>
                  ) : (
                    <MuiTable
                      columns={printColumns}
                      data={badgePrints}
                      options={{ sortCol: order, sortDir: orderDir }}
                      perPage={perPage}
                      currentPage={currentPage}
                      totalRows={totalBadgePrints}
                      onPageChange={(page) =>
                        onBadgePrintQuery(
                          term,
                          page,
                          perPage,
                          order,
                          orderDir,
                          appliedFilters
                        )
                      }
                      onSort={(key, dir) =>
                        onBadgePrintQuery(
                          term,
                          DEFAULT_CURRENT_PAGE,
                          perPage,
                          key,
                          dir,
                          appliedFilters
                        )
                      }
                    />
                  )}
                </>
              ) : (
                <MuiTable
                  columns={printExcerptColumns}
                  data={printExcerptRows}
                />
              )}
              <Link
                component="button"
                type="button"
                onClick={handleTogglePrintDetails}
                sx={{ mt: 1 }}
              >
                {showPrintDetails
                  ? T.translate("edit_ticket.print_excerpt_less")
                  : T.translate("edit_ticket.print_excerpt_details")}
              </Link>
            </Grid2>
          )}
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="print_type" sx={BOLD_LABEL_SX}>
              {T.translate("edit_ticket.print_type")}
            </InputLabel>
            <MuiDropdown
              id="print_type"
              size="small"
              value={selectedPrintType ?? ""}
              options={viewTypeOptions}
              onChange={(ev) => onSelectPrintType(ev.target.value)}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel aria-hidden sx={BOLD_LABEL_SX}>
              &nbsp;
            </InputLabel>
            <Button
              variant="contained"
              onClick={onPrintBadge}
              disabled={!canPrint || selectedPrintType === null}
            >
              {T.translate("edit_ticket.print")}
            </Button>
          </Grid2>
        </Grid2>
      )}

      {entity.id !== 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          <InputLabel htmlFor="badge_features" sx={BOLD_LABEL_SX}>
            {T.translate("edit_ticket.badge_features")}
          </InputLabel>
          <Autocomplete
            id="badge_features"
            multiple
            disableClearable
            size="small"
            options={badgeFeatures}
            value={entity.features ?? []}
            getOptionLabel={(feature) => feature.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={handleFeaturesChange}
            renderInput={(params) => <TextField {...params} />}
          />
        </>
      )}
    </Box>
  );
};

BadgeForm.propTypes = {
  entity: PropTypes.shape({
    id: PropTypes.number,
    ticket_id: PropTypes.number,
    type_id: PropTypes.number,
    features: PropTypes.arrayOf(PropTypes.object),
    print_excerpt: PropTypes.object
  }).isRequired,
  currentSummit: PropTypes.object.isRequired,
  canPrint: PropTypes.bool,
  selectedPrintType: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  badgePrints: PropTypes.object.isRequired,
  onTypeChange: PropTypes.func.isRequired,
  onSelectPrintType: PropTypes.func.isRequired,
  onPrintBadge: PropTypes.func.isRequired,
  onShowBadgePrints: PropTypes.func.isRequired,
  onBadgePrintQuery: PropTypes.func.isRequired,
  onBadgePrintExport: PropTypes.func.isRequired,
  clearBadgePrints: PropTypes.func.isRequired,
  onFeatureLink: PropTypes.func.isRequired,
  onFeatureUnLink: PropTypes.func.isRequired
};

BadgeForm.defaultProps = {
  canPrint: false,
  selectedPrintType: null
};

export default BadgeForm;
