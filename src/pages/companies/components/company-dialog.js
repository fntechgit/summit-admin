/**
 * Copyright 2024 OpenStack Foundation
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

import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid2,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { UploadInputV3 } from "openstack-uicore-foundation/lib/components";
import { getCountryList } from "openstack-uicore-foundation/lib/utils/query-actions";
import Table from "openstack-uicore-foundation/lib/components/mui/table";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
// import MuiFormikAsyncAutocomplete from "openstack-uicore-foundation/lib/components/mui/formik-inputs/async-select";
import useScrollToError from "../../../hooks/useScrollToError";
import FormikTextEditor from "../../../components/inputs/formik-text-editor";
import MuiFormikColorInput from "../../../components/mui/formik-inputs/mui-formik-color-input";
import MuiFormikAsyncAutocomplete from "../../../components/mui/formik-inputs/mui-formik-async-select";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";

const MEMBER_LEVELS = [
  { label: "Platinum", value: "Platinum" },
  { label: "Gold", value: "Gold" },
  { label: "StartUp", value: "StartUp" },
  { label: "Corporate", value: "Corporate" },
  { label: "Mention", value: "Mention" },
  { label: "None", value: "None" }
];

const getLogoValue = (value) =>
  value ? [{ filename: value, file_path: value }] : [];

const CompanyDialog = ({
  entity: initialEntity,
  sponsoredProjects = [],
  onSave,
  onClose,
  onDeleteSponsorship,
  onAddSponsorship
}) => {
  const [selectedSponsoredProject, setSelectedSponsoredProject] =
    useState(null);
  const [selectedSponsorShipType, setSelectedSponsorShipType] = useState(null);
  const [sponsorShipTypes, setSponsorShipTypes] = useState([]);

  const formik = useFormik({
    initialValues: {
      id: initialEntity?.id ?? 0,
      name: initialEntity?.name ?? "",
      url: initialEntity?.url ?? "",
      contact_email: initialEntity?.contact_email ?? "",
      member_level: initialEntity?.member_level ?? "",
      admin_email: initialEntity?.admin_email ?? "",
      city: initialEntity?.city ?? "",
      state: initialEntity?.state ?? "",
      industry: initialEntity?.industry ?? "",
      products: initialEntity?.products ?? "",
      contributions: initialEntity?.contributions ?? "",
      description: initialEntity?.description ?? "",
      overview: initialEntity?.overview ?? "",
      commitment: initialEntity?.commitment ?? "",
      logo: initialEntity?.logo ?? "",
      big_logo: initialEntity?.big_logo ?? ""
    },
    enableReinitialize: true,
    validationSchema: yup.object().shape({
      name: yup.string().required(T.translate("validation.required"))
    }),
    onSubmit: (values) => onSave(values)
  });

  useScrollToError(formik, true);

  const title = initialEntity?.id
    ? `${T.translate("general.edit")} ${T.translate("edit_company.company")}`
    : `${T.translate("general.add")} ${T.translate("edit_company.company")}`;

  const handleLogoUploadComplete = (field) => (response) => {
    const path =
      response.path && response.name
        ? `${response.path}${response.name}`
        : response.file_url ?? response.path ?? "";
    formik.setFieldValue(field, path);
  };

  const handleLogoRemove = (field) => () => {
    formik.setFieldValue(field, "");
  };

  const handleSelectedSponsoredProject = (ev) => {
    const { value } = ev.target;
    const project = sponsoredProjects.find((p) => p.id == value);
    setSelectedSponsoredProject(value);
    setSponsorShipTypes(
      project
        ? project.sponsorship_types.map((s) => ({ label: s.name, value: s.id }))
        : []
    );
    setSelectedSponsorShipType(null);
  };

  const handleAddSponsorshipType = () => {
    if (!selectedSponsoredProject || !selectedSponsorShipType) return;
    onAddSponsorship(
      formik.values.id,
      selectedSponsoredProject,
      selectedSponsorShipType
    );
  };

  const handleDeleteSponsorship = (sponsorshipId) => {
    const sponsorship = initialEntity?.project_sponsorships?.find(
      (ps) => ps.id === sponsorshipId
    );
    if (!sponsorship) return;
    const supportingCompany = sponsorship.supporting_companies?.find(
      (sc) => sc.company_id === formik.values.id
    );
    if (!supportingCompany) return;

    const confirm = showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_company.delete_supporting_company_warning")
    });

    if (confirm)
      onDeleteSponsorship(
        sponsorship.sponsored_project.id,
        sponsorshipId,
        supportingCompany.id
      );
  };

  const sponsored_project_columns = [
    {
      columnKey: "project_name",
      header: T.translate("edit_company.project_name")
    },
    { columnKey: "name", header: T.translate("edit_company.sponsorship_type") }
  ];

  const sponsored_projects_ddl = sponsoredProjects.map((sp) => ({
    label: sp.name,
    value: sp.id
  }));

  const showOpenStackSection =
    formik.values.id > 0 && window.APP_CLIENT_NAME === "openstack";

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography fontSize="1.5rem">{title}</Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ mr: 1 }}
          aria-label="close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <FormikProvider value={formik}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          noValidate
          autoComplete="off"
        >
          <DialogContent sx={{ p: 0 }}>
            <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
              <Grid2 size={4}>
                <InputLabel htmlFor="name">
                  {T.translate("edit_company.name")} *
                </InputLabel>
                <MuiFormikTextField name="name" margin="none" fullWidth />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="url">
                  {T.translate("edit_company.url")}
                </InputLabel>
                <MuiFormikTextField name="url" margin="none" fullWidth />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="contact_email">
                  {T.translate("edit_company.contact_email")}
                </InputLabel>
                <MuiFormikTextField
                  name="contact_email"
                  margin="none"
                  fullWidth
                />
              </Grid2>

              <Grid2 size={4}>
                <InputLabel htmlFor="member_level">
                  {T.translate("edit_company.member_level")}
                </InputLabel>
                <MuiFormikSelect name="member_level" isClearable>
                  {MEMBER_LEVELS.map((lvl) => (
                    <MenuItem key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </MenuItem>
                  ))}
                </MuiFormikSelect>
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="color">
                  {T.translate("edit_company.color")}
                </InputLabel>
                <MuiFormikColorInput
                  name="color"
                  id="color"
                  margin="none"
                  fullWidth
                />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="admin_email">
                  {T.translate("edit_company.admin_email")}
                </InputLabel>
                <MuiFormikTextField
                  name="admin_email"
                  margin="none"
                  fullWidth
                />
              </Grid2>

              <Grid2 size={4}>
                <InputLabel htmlFor="city">
                  {T.translate("edit_company.city")}
                </InputLabel>
                <MuiFormikTextField name="city" margin="none" fullWidth />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="state">
                  {T.translate("edit_company.state")}
                </InputLabel>
                <MuiFormikTextField name="state" margin="none" fullWidth />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="state">
                  {T.translate("edit_company.country")}
                </InputLabel>
                <MuiFormikAsyncAutocomplete
                  name="country"
                  fullWidth
                  margin="none"
                  queryFunction={(_input, callback) => getCountryList(callback)}
                  formatOption={(country) => ({
                    value: country.iso_code,
                    label: country.name
                  })}
                  defaultOptions
                />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="industry">
                  {T.translate("edit_company.industry")}
                </InputLabel>
                <MuiFormikTextField name="industry" margin="none" fullWidth />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="products">
                  {T.translate("edit_company.products")}
                </InputLabel>
                <MuiFormikTextField name="products" margin="none" fullWidth />
              </Grid2>
              <Grid2 size={4}>
                <InputLabel htmlFor="contributions">
                  {T.translate("edit_company.contributions")}
                </InputLabel>
                <MuiFormikTextField
                  name="contributions"
                  margin="none"
                  fullWidth
                />
              </Grid2>

              <Grid2 size={12}>
                <InputLabel htmlFor="description">
                  {T.translate("edit_company.description")}
                </InputLabel>
                <FormikTextEditor name="description" />
              </Grid2>
              <Grid2 size={12}>
                <InputLabel htmlFor="overview">
                  {T.translate("edit_company.overview")}
                </InputLabel>
                <FormikTextEditor name="overview" />
              </Grid2>
              <Grid2 size={12}>
                <InputLabel htmlFor="commitment">
                  {T.translate("edit_company.commitment")}
                </InputLabel>
                <FormikTextEditor name="commitment" />
              </Grid2>

              {showOpenStackSection && (
                <Grid2 container size={12} mt={2} mb={2} alignItems="end">
                  <Grid2 size={4}>
                    <InputLabel htmlFor="sponsored_project">
                      {T.translate("edit_company.project_name")}
                    </InputLabel>
                    <FormControl fullWidth>
                      <Select
                        id="sponsored_project"
                        value={selectedSponsoredProject ?? ""}
                        onChange={handleSelectedSponsoredProject}
                        displayEmpty
                        renderValue={(selected) =>
                          selected ? (
                            sponsored_projects_ddl.find(
                              (sp) => sp.value === selected
                            )?.label
                          ) : (
                            <span style={{ color: "#aaa" }}>
                              {T.translate(
                                "edit_company.placeholders.sponsored_project"
                              )}
                            </span>
                          )
                        }
                      >
                        {sponsored_projects_ddl.map((sp) => (
                          <MenuItem key={sp.value} value={sp.value}>
                            {sp.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid2>

                  <Grid2 size={4}>
                    <InputLabel htmlFor="sponsorship_type">
                      {T.translate("edit_company.sponsorship_type")}
                    </InputLabel>
                    <FormControl fullWidth>
                      <Select
                        id="sponsorship_type"
                        value={selectedSponsorShipType ?? ""}
                        onChange={(ev) =>
                          setSelectedSponsorShipType(ev.target.value)
                        }
                        displayEmpty
                      >
                        {sponsorShipTypes.length === 0 ? (
                          <MenuItem value="" disabled>
                            {T.translate(
                              "edit_company.placeholders.no_options"
                            )}
                          </MenuItem>
                        ) : (
                          sponsorShipTypes.map((st) => (
                            <MenuItem key={st.value} value={st.value}>
                              {st.label}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid2>
                  <Grid2 size={4}>
                    <InputLabel sx={{ visibility: "hidden" }}>
                      &nbsp;
                    </InputLabel>
                    <Button
                      variant="contained"
                      onClick={handleAddSponsorshipType}
                      fullWidth
                      sx={{ height: "56px" }}
                    >
                      {T.translate("edit_company.add_project_sponsorship")}
                    </Button>
                  </Grid2>
                </Grid2>
              )}

              {initialEntity.project_sponsorships.length > 0 &&
                window.APP_CLIENT_NAME == "openstack" && (
                  <Grid2 size={12} mb={2}>
                    <Table
                      data={initialEntity.project_sponsorships.map((sp) => ({
                        ...sp,
                        project_name: sp.sponsored_project.name
                      }))}
                      columns={sponsored_project_columns}
                      onDelete={handleDeleteSponsorship}
                    />
                  </Grid2>
                )}

              <Grid2 size={6}>
                <InputLabel>{T.translate("edit_company.logo")}</InputLabel>
                <UploadInputV3
                  id="logo"
                  name="logo"
                  value={getLogoValue(formik.values.logo)}
                  onUploadComplete={handleLogoUploadComplete("logo")}
                  onRemove={handleLogoRemove("logo")}
                  postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
                  djsConfig={{ withCredentials: true }}
                  maxFiles={1}
                  canAdd={!formik.values.logo}
                  mediaType={{
                    type: {
                      allowed_extensions: ["jpg", "jpeg", "png", "gif", "svg"]
                    }
                  }}
                />
              </Grid2>
              <Grid2 size={6}>
                <InputLabel>{T.translate("edit_company.big_logo")}</InputLabel>
                <UploadInputV3
                  id="big_logo"
                  name="big_logo"
                  value={getLogoValue(formik.values.big_logo)}
                  onUploadComplete={handleLogoUploadComplete("big_logo")}
                  onRemove={handleLogoRemove("big_logo")}
                  postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
                  djsConfig={{ withCredentials: true }}
                  maxFiles={1}
                  canAdd={!formik.values.big_logo}
                  mediaType={{
                    type: {
                      allowed_extensions: ["jpg", "jpeg", "png", "gif", "svg"]
                    }
                  }}
                />
              </Grid2>
            </Grid2>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button type="submit" fullWidth variant="contained">
              {T.translate("general.save")}
            </Button>
          </DialogActions>
        </Box>
      </FormikProvider>
    </Dialog>
  );
};

CompanyDialog.propTypes = {
  entity: PropTypes.object.isRequired,
  sponsoredProjects: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDeleteSponsorship: PropTypes.func,
  onAddSponsorship: PropTypes.func
};

export default CompanyDialog;
