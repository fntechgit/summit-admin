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
import { Box, Button, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PromocodeForm, {
  buildPromocodeValues,
  promocodeValidationSchema,
  toPromocodeEntity
} from "../../components/forms/promocode-form";
import {
  getPromocode,
  getPromocodeMeta,
  resetPromocodeForm,
  sendEmail,
  savePromocode,
  assignSpeaker,
  getAssignedSpeakers,
  unAssignSpeaker
} from "../../actions/promocode-actions";
import { getBadgeFeatures, getBadgeTypes } from "../../actions/badge-actions";
import useScrollToError from "../../hooks/useScrollToError";

const EditPromocodePage = ({
  currentSummit,
  allClasses,
  entity,
  match,
  history,
  getPromocode,
  getPromocodeMeta,
  getBadgeFeatures,
  getBadgeTypes,
  resetPromocodeForm,
  sendEmail,
  savePromocode,
  assignSpeaker,
  getAssignedSpeakers,
  unAssignSpeaker
}) => {
  const promocodeId = match.params.promocode_id;
  // the same page serves the summit and the sponsor promo code lists
  const listUrl = match.url.substring(0, match.url.lastIndexOf("/"));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // reset first so a stale entity with the same id never seeds the form
    resetPromocodeForm();
    if (promocodeId) getPromocode(promocodeId);
  }, [promocodeId]);

  useEffect(() => {
    getPromocodeMeta();
    if (!currentSummit.badge_features) getBadgeFeatures();
    if (!currentSummit.badge_types) getBadgeTypes();
  }, []);

  const formik = useFormik({
    initialValues: buildPromocodeValues(entity, currentSummit),
    validationSchema: promocodeValidationSchema,
    onSubmit: (values) => {
      if (isSaving) return;
      const isNew = !entity.id;
      setIsSaving(true);
      savePromocode(toPromocodeEntity(values, entity, currentSummit))
        .then(({ response }) =>
          // a new code goes to its edit page, where rates, speakers and emails need a saved id
          history.push(isNew ? `${listUrl}/${response.id}` : listUrl)
        )
        .catch(() => {})
        .finally(() => setIsSaving(false));
    }
  });

  useScrollToError(formik);

  useEffect(() => {
    formik.resetForm({ values: buildPromocodeValues(entity, currentSummit) });
  }, [entity.id]);

  if (promocodeId && String(entity.id) !== promocodeId) {
    return null;
  }

  if (
    !allClasses.length ||
    !currentSummit.badge_features ||
    !currentSummit.badge_types
  ) {
    return <div />;
  }

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.code : T.translate("general.new");

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Grid2
        container
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Grid2>
          <h3>
            {title} {T.translate("edit_promocode.promocode")}
          </h3>
        </Grid2>
        {entity.id > 0 && (
          <Grid2>
            <Button
              variant="contained"
              onClick={() => history.push(`${listUrl}/new`)}
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
          <PromocodeForm
            entity={entity}
            currentSummit={currentSummit}
            allClasses={allClasses}
            onSendEmail={sendEmail}
            assignSpeaker={assignSpeaker}
            getAssignedSpeakers={getAssignedSpeakers}
            unAssignSpeaker={unAssignSpeaker}
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

const mapStateToProps = ({ currentSummitState, currentPromocodeState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentPromocodeState
});

export default connect(mapStateToProps, {
  getPromocode,
  getPromocodeMeta,
  getBadgeFeatures,
  getBadgeTypes,
  resetPromocodeForm,
  sendEmail,
  savePromocode,
  assignSpeaker,
  getAssignedSpeakers,
  unAssignSpeaker
})(EditPromocodePage);
