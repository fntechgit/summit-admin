/**
 * Copyright 2017 OpenStack Foundation
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
import { Breadcrumb } from "react-breadcrumbs";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import { Box, Button, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CompanyForm from "../../components/forms/company-form";
import {
  getCompany,
  resetCompanyForm,
  saveCompany,
  attachLogo,
  removeLogo
} from "../../actions/company-actions";
import {
  getSponsoredProjects,
  saveSupportingCompany,
  deleteSupportingCompany
} from "../../actions/sponsored-project-actions";
import { MAX_PER_PAGE } from "../../utils/constants";
import { hexColorValidation } from "../../utils/yup";

const EditCompanyPage = ({
  entity: initialEntity,
  sponsoredProjects,
  match,
  history,
  getCompany,
  resetCompanyForm,
  saveCompany,
  attachLogo,
  removeLogo,
  getSponsoredProjects,
  saveSupportingCompany,
  deleteSupportingCompany
}) => {
  const companyId = match.params.company_id;
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!companyId) {
      resetCompanyForm();
    } else {
      getCompany(companyId);
    }
  }, [companyId]);

  useEffect(() => {
    if (window.APP_CLIENT_NAME === "openstack")
      getSponsoredProjects("", 1, MAX_PER_PAGE);
  }, []);

  const formik = useFormik({
    initialValues: {
      id: initialEntity?.id ?? 0,
      name: initialEntity?.name ?? "",
      url: initialEntity?.url ?? "",
      contact_email: initialEntity?.contact_email ?? "",
      member_level: initialEntity?.member_level ?? "",
      color: initialEntity?.color ?? "",
      admin_email: initialEntity?.admin_email ?? "",
      city: initialEntity?.city ?? "",
      state: initialEntity?.state ?? "",
      country: initialEntity?.country ?? "",
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
      name: yup.string().required(T.translate("validation.required")),
      color: hexColorValidation()
    }),
    onSubmit: (values) => {
      if (isSaving) return;
      const valuesToSave = {
        ...values,
        country:
          typeof values.country === "object"
            ? values.country?.value
            : values.country
      };
      setIsSaving(true);
      saveCompany(valuesToSave)
        .then(() => history.push("/app/companies"))
        .catch(() => {})
        .finally(() => setIsSaving(false));
    }
  });

  const title = initialEntity?.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = initialEntity?.id
    ? initialEntity.name
    : T.translate("general.new");

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Grid2
        container
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Grid2>
          <h3>
            {title} {T.translate("edit_company.company")}
          </h3>
        </Grid2>
        {initialEntity?.id > 0 && (
          <Grid2>
            <Button
              variant="contained"
              onClick={() => history.push("/app/companies/new")}
              startIcon={<AddIcon />}
            >
              {T.translate("general.add_new")}
            </Button>
          </Grid2>
        )}
      </Grid2>
      <hr />
      <FormikProvider value={formik}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          noValidate
          autoComplete="off"
        >
          <CompanyForm
            initialEntity={initialEntity}
            sponsoredProjects={sponsoredProjects}
            onAttach={attachLogo}
            onRemove={removeLogo}
            onAddSponsorship={saveSupportingCompany}
            onDeleteSponsorship={deleteSupportingCompany}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
          />
          <Grid2
            size={12}
            sx={{ p: 3, pt: 0, display: "flex", justifyContent: "flex-end" }}
          >
            <Button type="submit" variant="contained" disabled={isSaving}>
              {T.translate("general.save")}
            </Button>
          </Grid2>
        </Box>
      </FormikProvider>
    </div>
  );
};

const mapStateToProps = ({
  currentCompanyState,
  sponsoredProjectListState
}) => ({
  ...currentCompanyState,
  sponsoredProjects: sponsoredProjectListState.sponsoredProjects
});

export default connect(mapStateToProps, {
  getCompany,
  resetCompanyForm,
  saveCompany,
  attachLogo,
  removeLogo,
  getSponsoredProjects,
  saveSupportingCompany,
  deleteSupportingCompany
})(EditCompanyPage);
