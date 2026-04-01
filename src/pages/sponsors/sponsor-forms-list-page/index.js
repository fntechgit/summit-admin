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

import React, { useEffect, useState, useRef } from "react";

import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid2
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import history from "../../../history";
import {
  archiveSponsorForm,
  getSponsorForm,
  getSponsorForms,
  getSponsorships,
  unarchiveSponsorForm,
  deleteSponsorForm,
  updateFormTemplateTiers
} from "../../../actions/sponsor-forms-actions";
import CustomAlert from "../../../components/mui/custom-alert";
import SearchInput from "../../../components/mui/search-input";
import GlobalTemplatePopup from "./components/global-template/global-template-popup";
import FormTemplatePopup from "./components/form-template/form-template-popup";
import MuiTable from "../../../components/mui/table/mui-table";
import DropdownCheckbox from "../../../components/mui/dropdown-checkbox";
import { DEFAULT_CURRENT_PAGE, MAX_PER_PAGE } from "../../../utils/constants";
import { normalizeTiers, sameTierSet } from "./utils";

const SponsorFormsListPage = ({
  sponsorForms,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  hideArchived,
  totalCount,
  getSponsorForms,
  getSponsorForm,
  getSponsorships,
  archiveSponsorForm,
  unarchiveSponsorForm,
  deleteSponsorForm,
  updateFormTemplateTiers,
  sponsorships
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  useEffect(() => {
    getSponsorForms();
    getSponsorships(DEFAULT_CURRENT_PAGE, MAX_PER_PAGE);
  }, [getSponsorForms, getSponsorships]);

  const handlePageChange = (page) => {
    getSponsorForms(term, page, perPage, order, orderDir, hideArchived);
  };
  const handlePerPageChange = (newPerPage) => {
    getSponsorForms(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      hideArchived
    );
  };
  const handleSort = (key, dir) => {
    getSponsorForms(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      key,
      dir,
      hideArchived
    );
  };

  const handleSearch = (searchTerm) => {
    getSponsorForms(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      hideArchived
    );
  };

  const handleRowEdit = (row) => {
    getSponsorForm(row.id).then(() => {
      setOpenPopup("edit");
    });
  };

  const handleRowDelete = (itemId) => {
    deleteSponsorForm(itemId);
  };

  const handleManageItems = (form) => {
    history.push(`forms/${form.id}/items`);
  };

  const handleArchiveItem = (item) =>
    item.is_archived
      ? unarchiveSponsorForm(item.id)
      : archiveSponsorForm(item.id);

  const handleHideArchivedForms = (ev) => {
    getSponsorForms(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      ev.target.checked
    );
  };

  const [editingTiersId, setEditingTiersId] = useState(null);
  const [tiersValue, setTiersValue] = useState([]);
  const dropdownRef = useRef();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  useEffect(() => {
    if (editingTiersId !== null && !dropdownOpen) {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          if (
            tiersValue.length === 0 ||
            sameTierSet(
              normalizeTiers(
                sponsorForms.find((f) => f.id === editingTiersId)
                  ?.sponsorship_types || []
              ),
              normalizeTiers(tiersValue)
            )
          ) {
            setEditingTiersId(null);
          }
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [editingTiersId, tiersValue, sponsorForms, dropdownOpen]);

  const handleTiersEdit = (row) => {
    setEditingTiersId(row.id);
    setTiersValue(normalizeTiers(row.sponsorship_types));
  };

  const handleTiersChange = (ev) => {
    let newValue = ev.target.value;
    if (!Array.isArray(newValue)) newValue = [newValue];
    setTiersValue(newValue);
  };

  const handleTiersSave = async (row) => {
    const prevAll = row.sponsorship_types?.includes("all");
    const prevIds = prevAll ? ["all"] : normalizeTiers(row.sponsorship_types);
    const nextAll = tiersValue.includes("all");
    const nextIds = nextAll ? ["all"] : normalizeTiers(tiersValue);
    const changed = prevAll !== nextAll || !sameTierSet(prevIds, nextIds);
    if (!changed) return;
    const sponsorship_types = nextIds;
    const apply_to_all_types = nextAll;
    if (!apply_to_all_types && sponsorship_types.length === 0) return;
    updateFormTemplateTiers({
      id: row.id,
      sponsorship_types,
      apply_to_all_types
    })
      .then(() => {
        setEditingTiersId(null);
      })
      .catch(() => {});
  };

  const columns = [
    {
      columnKey: "code",
      header: T.translate("sponsor_forms.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("sponsor_forms.name_column_label"),
      sortable: true
    },
    {
      columnKey: "tiers",
      header: T.translate("sponsor_forms.tiers_column_label"),
      sortable: false,
      width: 140,
      render: (row) => {
        const cellStyle = {
          width: 140,
          maxWidth: 140,
          minWidth: 140,
          display: "block"
        };
        if (editingTiersId === row.id) {
          const options =
            sponsorships && sponsorships.items ? sponsorships.items : [];
          const value = normalizeTiers(tiersValue);
          return (
            <div
              style={cellStyle}
              className="tiers-inline-container"
              ref={dropdownRef}
            >
              <DropdownCheckbox
                name="tiers-inline"
                label={T.translate(
                  "sponsor_forms.form_template_popup.sponsorship"
                )}
                allLabel={T.translate(
                  "sponsor_forms.form_template_popup.all_tiers"
                )}
                value={value}
                options={options}
                onChange={handleTiersChange}
                onClose={() => {
                  setDropdownOpen(false);
                  handleTiersSave(row);
                }}
                onOpen={() => setDropdownOpen(true)}
              />
            </div>
          );
        }
        let label = "-";
        if (row.sponsorship_types && Array.isArray(row.sponsorship_types)) {
          if (row.sponsorship_types.includes("all")) {
            label = T.translate("sponsor_forms.form_template_popup.all_tiers");
          } else if (row.sponsorship_types.length > 0) {
            const sponsorshipOptions =
              sponsorships && sponsorships.items ? sponsorships.items : [];
            const validNames = row.sponsorship_types
              .map((id) => {
                const found = sponsorshipOptions.find((s) => s.id === id);
                return found ? found.name : null;
              })
              .filter((name) => name !== null);
            label = validNames.length > 0 ? validNames.join(", ") : "-";
          }
        }
        return (
          <div style={cellStyle}>
            <span
              style={{
                cursor: "pointer",
                textDecoration: "underline dotted",
                display: "block",
                whiteSpace: "normal",
                wordBreak: "break-word",
                verticalAlign: "middle"
              }}
              title={label}
              onClick={() => handleTiersEdit(row)}
            >
              {label}
            </span>
          </div>
        );
      }
    },
    {
      columnKey: "items_qty",
      width: 100,
      header: T.translate("sponsor_forms.items_column_label"),
      sortable: false
    },
    {
      columnKey: "manage_items",
      header: "",
      width: 175,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="small"
          onClick={() => handleManageItems(row)}
        >
          {T.translate("sponsor_forms.manage_items_button")}
        </Button>
      ),
      dottedBorder: true
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir,
    disableProp: "is_archived"
  };

  return (
    <div className="container">
      <h3>{T.translate("sponsor_forms.forms")}</h3>
      <CustomAlert message={T.translate("sponsor_forms.alert_info")} hideIcon />
      <Grid2
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={1}>
          <Box component="span">{totalCount} forms</Box>
        </Grid2>
        <Grid2 size={2} offset={1}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={handleHideArchivedForms}
                  inputProps={{
                    "aria-label": T.translate("sponsor_forms.hide_archived")
                  }}
                />
              }
              label={T.translate("sponsor_forms.hide_archived")}
            />
          </FormGroup>
        </Grid2>
        <Grid2 size={2}>
          <SearchInput
            term={term}
            onSearch={handleSearch}
            placeholder={T.translate("sponsor_forms.placeholders.search")}
          />
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setOpenPopup("clone")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("sponsor_forms.using_global")}
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setOpenPopup("new")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("sponsor_forms.add_form")}
          </Button>
        </Grid2>
      </Grid2>

      {sponsorForms.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={sponsorForms}
            options={tableOptions}
            perPage={perPage}
            totalRows={totalCount}
            currentPage={currentPage}
            onDelete={handleRowDelete}
            deleteDialogBody={(name) =>
              T.translate("sponsor_forms.remove_form_warning", { name })
            }
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleRowEdit}
            onArchive={handleArchiveItem}
          />
        </div>
      )}
      <GlobalTemplatePopup
        open={openPopup === "clone"}
        onClose={() => setOpenPopup(null)}
      />
      <FormTemplatePopup
        open={openPopup === "new" || openPopup === "edit"}
        onClose={() => setOpenPopup(null)}
        edit={openPopup === "edit"}
      />
    </div>
  );
};

const mapStateToProps = ({ sponsorFormsListState }) => ({
  ...sponsorFormsListState
});

export default connect(mapStateToProps, {
  getSponsorForms,
  getSponsorForm,
  getSponsorships,
  archiveSponsorForm,
  unarchiveSponsorForm,
  deleteSponsorForm,
  updateFormTemplateTiers
})(SponsorFormsListPage);
