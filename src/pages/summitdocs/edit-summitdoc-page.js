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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import SummitDocForm from "../../components/forms/summitdoc-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  addFileToDoc,
  getSummitDoc,
  removeFileFromDoc,
  resetSummitDocForm,
  saveSummitDoc
} from "../../actions/summitdoc-actions";
import AddNewButton from "../../components/buttons/add-new-button";
import { requiredStringValidation } from "../../utils/yup";
// import '../../styles/edit-summitdoc-page.less';

export const buildValues = (entity) => ({
  id: entity?.id ?? 0,
  name: entity?.name ?? "",
  label: entity?.label ?? "",
  description: entity?.description ?? "",
  event_types: entity?.event_types ?? [],
  file_preview: entity?.file_preview ?? "",
  file: entity?.file ?? null,
  selection_plan_id: entity?.selection_plan_id ?? "",
  show_always: !!entity?.show_always,
  web_link: entity?.web_link ?? ""
});

export const validationSchema = yup.object().shape({
  name: requiredStringValidation(),
  label: requiredStringValidation(),
  description: requiredStringValidation(),
  event_types: yup.array().when("show_always", {
    is: true,
    then: (schema) => schema,
    otherwise: (schema) => schema.min(1, T.translate("validation.required"))
  }),
  file_preview: yup.string().nullable(),
  file: yup.mixed().nullable(),
  web_link: yup
    .string()
    .nullable()
    .when(["file_preview", "file"], {
      is: (filePreview, file) => !filePreview && !file,
      then: (schema) => schema.required(T.translate("validation.required")),
      otherwise: (schema) => schema
    })
});

const EditSummitDocPage = ({
  currentSummit,
  entity,
  match,
  history,
  getSummitDoc,
  resetSummitDocForm,
  saveSummitDoc,
  addFileToDoc,
  removeFileFromDoc
}) => {
  const summitDocId = match.params.summitdoc_id;
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!summitDocId) {
      resetSummitDocForm();
    } else {
      getSummitDoc(summitDocId);
    }
  }, [summitDocId]);

  const formik = useFormik({
    initialValues: buildValues(entity),
    validationSchema,
    onSubmit: (values) => {
      saveSummitDoc(values, file)
        .then(() => {
          history.push(`/app/summits/${currentSummit.id}/summitdocs`);
        })
        .catch(() => {});
    }
  });

  useEffect(() => {
    formik.resetForm({ values: buildValues(entity) });
    setFile(null);
  }, [entity.id]);

  // addFileToDoc/removeFileFromDoc update entity.file directly via redux,
  // independent of entity.id - resync just this field so it doesn't go
  // stale, without resetting the rest of the in-progress form.
  useEffect(() => {
    formik.setFieldValue("file", entity.file ?? null);
  }, [entity.file]);

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.label : T.translate("general.new");

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("summitdoc.summitdoc")}
        <AddNewButton entity={entity} />
      </h3>
      <hr />
      {currentSummit && (
        <FormikProvider value={formik}>
          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <SummitDocForm
              currentSummit={currentSummit}
              addFileToDoc={addFileToDoc}
              removeFileFromDoc={removeFileFromDoc}
              setFile={setFile}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="submit" variant="contained">
                {T.translate("general.save")}
              </Button>
            </Box>
          </Box>
        </FormikProvider>
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, summitDocState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...summitDocState
});

export default connect(mapStateToProps, {
  addFileToDoc,
  getSummitById,
  getSummitDoc,
  removeFileFromDoc,
  resetSummitDocForm,
  saveSummitDoc
})(EditSummitDocPage);
