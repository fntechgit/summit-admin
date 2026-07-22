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

import React, { useState, useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import Input from "openstack-uicore-foundation/lib/components/inputs/text-input";
import UploadInputV3 from "openstack-uicore-foundation/lib/components/inputs/upload-input-v3";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import { scrollToError, hasErrors } from "../../utils/methods";
import {
  ALLOWED_SLIDES_FORMATS,
  KB,
  MAX_MEDIA_UPLOAD_SIZE,
  MAX_SLIDE_UPLOAD_SIZE
} from "../../utils/constants";

const MATERIAL_TYPE = {
  PRESENTATION_LINK: "PresentationLink",
  PRESENTATION_MEDIA_UPLOAD: "PresentationMediaUpload",
  PRESENTATION_SLIDE: "PresentationSlide",
  PRESENTATION_VIDEO: "PresentationVideo"
};

const EventMaterialForm = ({ entity, errors, event, onSubmit }) => {
  const [entityState, setEntityState] = useState(entity);
  const [errorsState, setErrorsState] = useState(errors);

  // on admin we upload one per time
  const mediaType = {
    ...entityState.media_upload_type,
    max_size:
      (entityState.media_upload_type?.max_size || MAX_MEDIA_UPLOAD_SIZE) * KB,
    max_uploads_qty: 1
  };
  const mediaInputValue = entityState.filename ? [entityState] : [];

  const eventMaterialsOpts = [
    { label: "Link", value: MATERIAL_TYPE.PRESENTATION_LINK },
    { label: "Slide", value: MATERIAL_TYPE.PRESENTATION_SLIDE },
    { label: "Video", value: MATERIAL_TYPE.PRESENTATION_VIDEO },
    { label: "Media Upload", value: MATERIAL_TYPE.PRESENTATION_MEDIA_UPLOAD }
  ];

  const mediaUploadsOpts = event.type.allowed_media_upload_types.map((mu) => ({
    label: mu.name,
    value: mu.id
  }));

  const disableInputs =
    entityState.class_name === MATERIAL_TYPE.PRESENTATION_MEDIA_UPLOAD;

  const slideMediaType = {
    id: "slide",
    max_size: MAX_SLIDE_UPLOAD_SIZE * KB,
    type: {
      allowed_extensions: ALLOWED_SLIDES_FORMATS
    }
  };

  useEffect(() => {
    setEntityState(entity);
    setErrorsState({});
  }, [entity]);

  useEffect(() => {
    scrollToError(errors);
    setErrorsState(errors);
  }, [errors]);

  const handleChange = (ev) => {
    let { value, id } = ev.target;

    if (ev.target.type === "checkbox") {
      value = ev.target.checked;
    }

    if (ev.target.type === "number") {
      value = parseInt(ev.target.value);
    }

    setEntityState({ ...entityState, [id]: value });
    setErrorsState({ ...errorsState, [id]: "" });
  };

  const handleChangeMUType = (ev) => {
    const { value } = ev.target;

    const type = event.type.allowed_media_upload_types.find(
      (mu) => mu.id === value
    );

    setEntityState({
      ...entityState,
      media_upload_type_id: value,
      media_upload_type: type,
      name: type.name
    });
    setErrorsState({ ...errorsState, media_upload_type_id: "" });
  };

  const handleRemoveFile = () => {
    setEntityState({
      ...entityState,
      file_link: "",
      filename: "",
      filepath: ""
    });
  };

  const onMediaUploadComplete = (response) => {
    if (response) {
      setEntityState({
        ...entityState,
        filepath: `${response.path}${response.name}`,
        filename: response.name
      });
    }
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    onSubmit(entityState);
  };

  return (
    <form className="event-material-form">
      <input type="hidden" id="id" value={entityState.id} />
      <div className="row form-group">
        <div className="col-md-4">
          <label> {T.translate("edit_event_material.type")} *</label>
          <Dropdown
            id="class_name"
            key="class_name_ddl"
            value={entityState.class_name}
            placeholder={T.translate(
              "edit_event_material.placeholders.select_type"
            )}
            options={eventMaterialsOpts}
            onChange={handleChange}
            disabled={entityState.id !== 0}
          />
        </div>
        {entityState.class_name === MATERIAL_TYPE.PRESENTATION_MEDIA_UPLOAD && (
          <div className="col-md-4">
            <label>
              {" "}
              {T.translate("edit_event_material.media_upload_type")} *
            </label>
            <Dropdown
              id="media_upload_type_id"
              value={entityState.media_upload_type_id}
              placeholder={T.translate(
                "edit_event_material.placeholders.select_type"
              )}
              options={mediaUploadsOpts}
              onChange={handleChangeMUType}
              disabled={entityState.id !== 0}
            />
          </div>
        )}
      </div>
      <div className="row form-group">
        <div className="col-md-6">
          <label> {T.translate("edit_event_material.name")} *</label>
          <Input
            id="name"
            value={entityState.name}
            onChange={handleChange}
            className="form-control"
            error={hasErrors("name", errorsState)}
            disabled={disableInputs}
          />
        </div>
        <div className="col-md-6 checkboxes-div">
          <div className="form-check abc-checkbox">
            <input
              type="checkbox"
              id="display_on_site"
              checked={entityState.display_on_site}
              onChange={handleChange}
              className="form-check-input"
            />
            <label className="form-check-label" htmlFor="display_on_site">
              {T.translate("edit_event_material.display_on_site")}
            </label>
          </div>
        </div>
      </div>

      {!disableInputs && (
        <div className="row form-group">
          <div className="col-md-12">
            <label> {T.translate("edit_event_material.description")} *</label>
            <TextEditorV3
              id="description"
              value={entityState.description}
              onChange={handleChange}
              error={hasErrors("description", errorsState)}
              license={process.env.JODIT_LICENSE_KEY}
            />
          </div>
        </div>
      )}
      {entityState.class_name === MATERIAL_TYPE.PRESENTATION_LINK && (
        <div className="row form-group">
          <div className="col-md-6">
            <label> {T.translate("edit_event_material.link")} *</label>
            <Input
              id="link"
              value={entityState.link}
              onChange={handleChange}
              className="form-control"
              error={hasErrors("link", errorsState)}
            />
          </div>
        </div>
      )}

      {entityState.class_name === MATERIAL_TYPE.PRESENTATION_SLIDE && (
        <div className="row form-group">
          <div className="col-md-12">
            <label>
              {" "}
              {T.translate("edit_event_material.slide")} (max size 500Mb)
            </label>
            <UploadInputV3
              id="slide"
              onUploadComplete={onMediaUploadComplete}
              value={mediaInputValue}
              mediaType={slideMediaType}
              postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
              error={hasErrors("slide", errorsState)}
              djsConfig={{ withCredentials: true }}
              parallelChunkUploads
            />
          </div>
          <div className="col-md-7 text-center">
            <br />
            <label> OR </label>
          </div>
          <div className="col-md-6">
            <label> {T.translate("edit_event_material.link")}</label>
            <Input
              id="link"
              value={entityState.link}
              onChange={handleChange}
              className="form-control"
              error={hasErrors("link", errorsState)}
            />
          </div>
        </div>
      )}

      {entityState.class_name === MATERIAL_TYPE.PRESENTATION_VIDEO && (
        <div className="row form-group">
          <div className="col-md-6">
            <label> {T.translate("edit_event_material.youtube_id")} *</label>
            <Input
              id="youtube_id"
              value={entityState.youtube_id}
              onChange={handleChange}
              className="form-control"
              error={hasErrors("youtube_id", errorsState)}
            />
          </div>
        </div>
      )}
      {entityState.class_name === MATERIAL_TYPE.PRESENTATION_VIDEO && (
        <div className="row form-group">
          <div className="col-md-6">
            <label> {T.translate("edit_event_material.external_url")} *</label>
            <Input
              id="external_url"
              value={entityState.external_url}
              onChange={handleChange}
              className="form-control"
              error={hasErrors("external_url", errorsState)}
            />
          </div>
        </div>
      )}

      {entityState.class_name === MATERIAL_TYPE.PRESENTATION_MEDIA_UPLOAD &&
        mediaType?.type && (
          <div className="row form-group">
            <div className="col-md-12">
              <label>
                {" "}
                {T.translate("edit_event_material.media_upload_file")}{" "}
                {`(max size: ${
                  entityState.media_upload_type.max_size / KB
                }Mb )`}
              </label>
              <UploadInputV3
                id={`media_upload_${mediaType.id}`}
                onUploadComplete={onMediaUploadComplete}
                value={mediaInputValue}
                mediaType={mediaType}
                onRemove={handleRemoveFile}
                postUrl={`${window.FILE_UPLOAD_API_BASE_URL}/api/v1/files/upload`}
                error={hasErrors(mediaType.name, errorsState)}
                djsConfig={{ withCredentials: true }}
                parallelChunkUploads
              />
            </div>
          </div>
        )}

      <div className="row">
        <div className="col-md-12 submit-buttons">
          <input
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary pull-right"
            value={T.translate("general.save")}
          />
        </div>
      </div>
    </form>
  );
};

export default EventMaterialForm;
