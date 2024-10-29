/**
 * Copyright 2020 OpenStack Foundation
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
import React from "react";
import T from "i18n-react/dist/i18n-react";
import {
  UploadInput,
  Input,
  TextArea,
  Panel,
  Dropdown
} from "openstack-uicore-foundation/lib/components";
import Switch from "react-switch";
import Swal from "sweetalert2";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import { isEmpty, scrollToError, shallowEqual } from "../../utils/methods";
import HexColorInput from "../inputs/hex-color-input";

class BadgeSettingsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      entity: { ...props.entity },
      errors: props.errors,
      showSection: null
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleUploadFile = this.handleUploadFile.bind(this);
    this.handleRemoveFile = this.handleRemoveFile.bind(this);
  }

  componentDidUpdate(prevProps) {
    const state = {};
    scrollToError(this.props.errors);

    if (!shallowEqual(prevProps.entity, this.props.entity)) {
      state.entity = { ...this.props.entity };
      state.errors = {};
    }

    if (!shallowEqual(prevProps.errors, this.props.errors)) {
      state.errors = { ...this.props.errors };
    }

    if (!isEmpty(state)) {
      this.setState({ ...this.state, ...state });
    }
  }

  toggleSection(section, ev) {
    const { showSection } = this.state;
    const newShowSection = showSection === section ? "main" : section;
    ev.preventDefault();

    this.setState({ showSection: newShowSection });
  }

  handleChange(ev) {
    const newEntity = { ...this.state.entity };
    const newErrors = { ...this.state.errors };
    let { value, id } = ev.target;

    if (ev.target.type === "checkbox") {
      value = ev.target.checked;
    }

    newErrors[id] = "";

    if (!newEntity[id]?.type) {
      const newEntityType = id.includes("_COLOR") ? "HEX_COLOR" : "TEXT";
      newEntity[id] = { ...newEntity[id], value, type: newEntityType };
    } else {
      newEntity[id] = { ...newEntity[id], value };
    }

    this.setState({ entity: newEntity, errors: newErrors });
  }

  handleUploadFile(file, props) {
    const { id } = props;

    const newEntity = { ...this.state.entity, type: "FILE" };

    newEntity[id].file = file;
    newEntity[id].file_preview = file.preview;

    this.setState({ entity: newEntity });
  }

  handleRemoveFile(attr) {
    const newEntity = { ...this.state.entity };

    newEntity[attr].file_preview = "";

    if (newEntity[attr].id) {
      newEntity[attr].file = "";
      this.props.onDeleteImage(newEntity[attr].id).then(() => {
        newEntity[attr].id = 0;
      });
    }

    this.setState({ entity: newEntity });
  }

  handleOnSwitchChange(setting, value) {
    const { entity, errors } = this.state;
    const newEntity = { ...entity };

    if (!newEntity.hasOwnProperty(setting)) {
      newEntity[setting] = { value: "", type: "TEXT" };
    }

    newEntity[setting].value = value;

    this.setState((prevState) => ({
      ...prevState,
      entity: newEntity,
      errors
    }));
  }

  handleSubmit(ev) {
    ev.preventDefault();

    // save only the settings with the following conditions
    const settingsToSave = Object.fromEntries(
      Object.entries(this.state.entity).filter(
        ([, values]) =>
          (values.type === "TEXT" && (values.value !== "" || values.id)) ||
          (values.type === "HEX_COLOR" && values.value !== "") ||
          (values.type === "FILE" && values.file)
      )
    );

    this.props.onSubmit(settingsToSave).then(() => {
      const success_message = {
        title: T.translate("general.done"),
        html: T.translate("badge_settings.badge_template_settings_updated"),
        type: "success"
      };

      Swal.fire(success_message);
    });
  }

  render() {
    const { entity, showSection } = this.state;
    const { currentSummit } = this.props;

    const ddlAlignOptions = [
      { label: "Left", value: "LEFT" },
      { label: "Right", value: "RIGHT" },
      { label: "Justify", value: "JUSTIFY" }
    ];

    const ddlFontCasing = [
      { label: "Lowercase", value: "LOWERCASE" },
      { label: "Uppercase", value: "UPPERCASE" }
    ];

    const ddlTextFitMode = [
      { label: "Single", value: "SINGLE" },
      { label: "Multi", value: "MULTI" }
    ];

    const ddlNameDisplayMode = [
      { label: "Full Name", value: "FULLNAME" },
      { label: "Stacked", value: "STACKED" },
      { label: "First Name Only", value: "FIRST_NAME_ONLY" },
      { label: "Last Name Only", value: "LAST_NAME_ONLY" }
    ];

    return (
      <form className="badge-settings-form">
        <input type="hidden" id="id" value={entity.id} />
        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_background_img")}
            </label>
            <br />
            <UploadInput
              id="BADGE_TEMPLATE_BACKGROUND_IMG"
              value={
                entity?.BADGE_TEMPLATE_BACKGROUND_IMG?.file_preview ||
                entity?.BADGE_TEMPLATE_BACKGROUND_IMG?.file
              }
              handleUpload={this.handleUploadFile}
              handleRemove={() =>
                this.handleRemoveFile("BADGE_TEMPLATE_BACKGROUND_IMG")
              }
              className="dropzone col-md-6"
              multiple={false}
            />
          </div>
          <div className="col-md-6 form-group">
            <label>
              {T.translate("badge_settings.badge_template_first_name_color")}
            </label>
            <br />
            <HexColorInput
              onChange={this.handleChange}
              id="BADGE_TEMPLATE_LAST_NAME_COLOR"
              value={entity?.BADGE_TEMPLATE_LAST_NAME_COLOR?.value}
              className="form-control"
            />
          </div>
          <div className="col-md-6 form-group">
            <label>
              {T.translate("badge_settings.badge_template_last_name_color")}
            </label>
            <br />
            <HexColorInput
              onChange={this.handleChange}
              id="BADGE_TEMPLATE_FIRST_NAME_COLOR"
              value={entity?.BADGE_TEMPLATE_FIRST_NAME_COLOR?.value}
              className="form-control"
            />
          </div>
          <div className="col-md-6 form-group">
            <label>
              {T.translate("badge_settings.badge_template_company_color")}
            </label>
            <br />
            <HexColorInput
              onChange={this.handleChange}
              id="BADGE_TEMPLATE_COMPANY_COLOR"
              value={entity?.BADGE_TEMPLATE_COMPANY_COLOR?.value}
              className="form-control"
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>{T.translate("badge_settings.badge_template_width")}</label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_WIDTH"
              value={entity?.BADGE_TEMPLATE_WIDTH?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>{T.translate("badge_settings.badge_template_height")}</label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_HEIGHT"
              value={entity?.BADGE_TEMPLATE_HEIGHT?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_background_img")}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_BACKGROUND_IMG"
              value={entity?.BADGE_TEMPLATE_BACKGROUND_IMG?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_background_color")}
            </label>
            <br />
            <HexColorInput
              onChange={this.handleChange}
              id="BADGE_TEMPLATE_BACKGROUND_COLOR"
              value={entity?.BADGE_TEMPLATE_BACKGROUND_COLOR?.value}
              className="form-control"
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_back_background_img")}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_BACK_BACKGROUND_IMG"
              value={entity?.BADGE_TEMPLATE_BACK_BACKGROUND_IMG?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_margin")} &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_MARGIN"
              value={entity?.BADGE_TEMPLATE_MARGIN?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_font_face_inline_definition"
              )}
            </label>
            <br />
            <TextArea
              className="form-control"
              id="BADGE_TEMPLATE_FONT_FACE_INLINE_DEFINITION"
              value={entity?.BADGE_TEMPLATE_FONT_FACE_INLINE_DEFINITION?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_text_fields_font_family"
              )}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_TEXT_FIELDS_FONT_FAMILY"
              value={entity?.BADGE_TEMPLATE_TEXT_FIELDS_FONT_FAMILY?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_name_display_mode")}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_NAME_DISPLAY_MODE"
              value={entity?.BADGE_TEMPLATE_NAME_DISPLAY_MODE?.value}
              onChange={this.handleChange}
              options={ddlNameDisplayMode}
              isClearable
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_title_padding")}{" "}
              &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_TITLE_PADDING"
              value={entity?.BADGE_TEMPLATE_TITLE_PADDING?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_title_text_align")}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_TITLE_TEXT_ALIGN"
              value={entity?.BADGE_TEMPLATE_TITLE_TEXT_ALIGN?.value}
              onChange={this.handleChange}
              options={ddlAlignOptions}
              isClearable
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_title_font_casing")}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_TITLE_FONT_CASE"
              value={entity?.BADGE_TEMPLATE_TITLE_FONT_CASE?.value}
              onChange={this.handleChange}
              options={ddlFontCasing}
              isClearable
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_title_font_size_min")}{" "}
              &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_TITLE_FONT_SIZE_MIN"
              value={entity?.BADGE_TEMPLATE_TITLE_FONT_SIZE_MIN?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_title_font_size_max")}{" "}
              &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_TITLE_FONT_SIZE_MAX"
              value={entity?.BADGE_TEMPLATE_TITLE_FONT_SIZE_MAX?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_title_text_fit_mode")}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_TITLE_TEXT_FIT_MODE"
              value={entity?.BADGE_TEMPLATE_TITLE_TEXT_FIT_MODE?.value}
              onChange={this.handleChange}
              options={ddlTextFitMode}
              isClearable
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_title_font_family")}
            </label>
            <br />
            <Input
              id="BADGE_TEMPLATE_TITLE_FONT_FAMILY"
              value={entity?.BADGE_TEMPLATE_TITLE_FONT_FAMILY?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_first_name_padding")}{" "}
              &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_FIRST_NAME_PADDING"
              value={entity?.BADGE_TEMPLATE_FIRST_NAME_PADDING?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_first_name_text_align"
              )}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_FIRST_NAME_TEXT_ALIGN"
              value={entity?.BADGE_TEMPLATE_FIRST_NAME_TEXT_ALIGN?.value}
              onChange={this.handleChange}
              options={ddlAlignOptions}
              isClearable
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_first_name_font_casing"
              )}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_FIRST_NAME_FONT_CASING"
              value={entity?.BADGE_TEMPLATE_FIRST_NAME_FONT_CASING?.value}
              onChange={this.handleChange}
              options={ddlFontCasing}
              isClearable
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_first_name_font_size_min"
              )}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_FIRST_NAME_FONT_SIZE_MIN"
              value={entity?.BADGE_TEMPLATE_FIRST_NAME_FONT_SIZE_MIN?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_first_name_font_size_max"
              )}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_FIRST_NAME_FONT_SIZE_MAX"
              value={entity?.BADGE_TEMPLATE_FIRST_NAME_FONT_SIZE_MAX?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_first_name_text_fit_mode"
              )}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_FIRST_NAME_TEXT_FIT_MODE"
              value={entity?.BADGE_TEMPLATE_FIRST_NAME_TEXT_FIT_MODE?.value}
              onChange={this.handleChange}
              options={ddlTextFitMode}
              isClearable
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_first_name_font_family"
              )}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_FIRST_NAME_FONT_FAMILY"
              value={entity?.BADGE_TEMPLATE_FIRST_NAME_FONT_FAMILY?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_last_name_padding")}{" "}
              &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_LAST_NAME_PADDING"
              value={entity?.BADGE_TEMPLATE_LAST_NAME_PADDING?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_last_name_text_align"
              )}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_LAST_NAME_TEXT_ALIGN"
              value={entity?.BADGE_TEMPLATE_LAST_NAME_TEXT_ALIGN?.value}
              onChange={this.handleChange}
              options={ddlAlignOptions}
              isClearable
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_last_name_font_casing"
              )}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_LAST_NAME_FONT_CASING"
              value={entity?.BADGE_TEMPLATE_LAST_NAME_FONT_CASING?.value}
              onChange={this.handleChange}
              options={ddlFontCasing}
              isClearable
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_last_name_font_size_min"
              )}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_LAST_NAME_FONT_SIZE_MIN"
              value={entity?.BADGE_TEMPLATE_LAST_NAME_FONT_SIZE_MIN?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_last_name_font_size_max"
              )}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_LAST_NAME_FONT_SIZE_MAX"
              value={entity?.BADGE_TEMPLATE_LAST_NAME_FONT_SIZE_MAX?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_last_name_text_fit_mode"
              )}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_LAST_NAME_TEXT_FIT_MODE"
              value={entity?.BADGE_TEMPLATE_LAST_NAME_TEXT_FIT_MODE?.value}
              onChange={this.handleChange}
              options={ddlTextFitMode}
              isClearable
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_last_name_font_family"
              )}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_LAST_NAME_FONT_FAMILY"
              value={entity?.BADGE_TEMPLATE_LAST_NAME_FONT_FAMILY?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_company_padding")}{" "}
              &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_COMPANY_PADDING"
              value={entity?.BADGE_TEMPLATE_COMPANY_PADDING?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_company_text_align")}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_COMPANY_TEXT_ALIGN"
              value={entity?.BADGE_TEMPLATE_COMPANY_TEXT_ALIGN?.value}
              onChange={this.handleChange}
              options={ddlAlignOptions}
              isClearable
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_company_font_casing")}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_COMPANY_FONT_CASING"
              value={entity?.BADGE_TEMPLATE_COMPANY_FONT_CASING?.value}
              onChange={this.handleChange}
              options={ddlFontCasing}
              isClearable
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_company_font_size_min"
              )}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_COMPANY_FONT_SIZE_MIN"
              value={entity?.BADGE_TEMPLATE_COMPANY_FONT_SIZE_MIN?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>
        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_company_font_size_max"
              )}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_COMPANY_FONT_SIZE_MAX"
              value={entity?.BADGE_TEMPLATE_COMPANY_FONT_SIZE_MAX?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate(
                "badge_settings.badge_template_company_text_fit_mode"
              )}
            </label>
            <br />
            <Dropdown
              id="BADGE_TEMPLATE_COMPANY_TEXT_FIT_MODE"
              value={entity?.BADGE_TEMPLATE_COMPANY_TEXT_FIT_MODE?.value}
              onChange={this.handleChange}
              options={ddlTextFitMode}
              isClearable
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_company_font_family")}
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_COMPANY_FONT_FAMILY"
              value={entity?.BADGE_TEMPLATE_COMPANY_FONT_FAMILY?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_font")} &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.url_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_FONT"
              value={entity?.BADGE_TEMPLATE_FONT?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_qr_display")}
            </label>
            <br />
            <Switch
              id="BADGE_TEMPLATE_QR_DISPLAY"
              checked={entity?.BADGE_TEMPLATE_QR_DISPLAY?.value || false}
              onChange={(val) => {
                this.handleOnSwitchChange("BADGE_TEMPLATE_QR_DISPLAY", val);
              }}
              uncheckedIcon={false}
              checkedIcon={false}
              className="react-switch"
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_qr_size")} &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_QR_SIZE"
              value={entity?.BADGE_TEMPLATE_QR_SIZE?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_qr_top")} &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_QR_TOP"
              value={entity?.BADGE_TEMPLATE_QR_TOP?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_qr_left")} &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_QR_LEFT"
              value={entity?.BADGE_TEMPLATE_QR_LEFT?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_text_fields_padding")}{" "}
              &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_TEXT_FIELDS_PADDING"
              value={entity?.BADGE_TEMPLATE_TEXT_FIELDS_PADDING?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_text_fields_color")}
            </label>
            <br />
            <HexColorInput
              onChange={this.handleChange}
              id="BADGE_TEMPLATE_TEXT_FIELDS_COLOR"
              value={entity?.BADGE_TEMPLATE_TEXT_FIELDS_COLOR?.value}
              className="form-control"
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_qr_color")}
            </label>
            <br />
            <HexColorInput
              onChange={this.handleChange}
              id="BADGE_TEMPLATE_QR_COLOR"
              value={entity?.BADGE_TEMPLATE_QR_COLOR?.value}
              className="form-control"
            />
          </div>
        </div>

        <hr />

        <div>
          <h3>{T.translate("badge_settings.badge_features")}</h3>
          <div className="form-group">
            <div className="row">
              <div className="col-md-6">
                <label>
                  {T.translate("badge_settings.badge_template_features_top")}{" "}
                  &nbsp;{" "}
                  <i
                    className="fa fa-info-circle"
                    aria-hidden="true"
                    title={T.translate("badge_settings.px_percentage_info")}
                  />
                </label>
                <br />
                <Input
                  className="form-control"
                  id="BADGE_TEMPLATE_FEATURES_TOP"
                  value={entity?.BADGE_TEMPLATE_FEATURES_TOP?.value}
                  onChange={this.handleChange}
                />
              </div>
              <div className="col-md-6">
                <label>
                  {T.translate("badge_settings.badge_template_features_left")}{" "}
                  &nbsp;{" "}
                  <i
                    className="fa fa-info-circle"
                    aria-hidden="true"
                    title={T.translate("badge_settings.px_percentage_info")}
                  />
                </label>
                <br />
                <Input
                  className="form-control"
                  id="BADGE_TEMPLATE_FEATURES_LEFT"
                  value={entity?.BADGE_TEMPLATE_FEATURES_LEFT?.value}
                  onChange={this.handleChange}
                />
              </div>
            </div>
            <br />
            <div className="row">
              <div className="col-md-6">
                <label>
                  {T.translate(
                    "badge_settings.badge_template_features_padding"
                  )}{" "}
                  &nbsp;{" "}
                  <i
                    className="fa fa-info-circle"
                    aria-hidden="true"
                    title={T.translate("badge_settings.px_percentage_info")}
                  />
                </label>
                <br />
                <Input
                  className="form-control"
                  id="BADGE_TEMPLATE_FEATURES_MARGIN"
                  value={entity?.BADGE_TEMPLATE_FEATURES_MARGIN?.value}
                  onChange={this.handleChange}
                />
              </div>
              <div className="col-md-6">
                <label>
                  {T.translate(
                    "badge_settings.badge_template_features_font_family"
                  )}
                </label>
                <br />
                <Input
                  className="form-control"
                  id="BADGE_TEMPLATE_FEATURES_FONT_FAMILY"
                  value={entity?.BADGE_TEMPLATE_FEATURES_FONT_FAMILY?.value}
                  onChange={this.handleChange}
                />
              </div>
            </div>
            <br />
            <div className="row">
              <div className="col-md-6">
                <label>
                  {T.translate(
                    "badge_settings.badge_template_features_text_color"
                  )}
                </label>
                <br />
                <HexColorInput
                  onChange={this.handleChange}
                  id="BADGE_TEMPLATE_FEATURES_TEXT_COLOR"
                  value={entity?.BADGE_TEMPLATE_FEATURES_TEXT_COLOR?.value}
                  className="form-control"
                />
              </div>
            </div>
          </div>
          {currentSummit.badge_features_types.map((bf) => {
            const badgeTemplateFeatureTop = `BADGE_TEMPLATE_FEATURE_${bf.id}_TOP`;
            const badgeTemplateFeatureLeft = `BADGE_TEMPLATE_FEATURE_${bf.id}_LEFT`;
            const badgeTemplateFeatureDisplayMode = `BADGE_TEMPLATE_FEATURE_${bf.id}_DISPLAY_MODE`;
            const badgeTemplateFeatureTextColor = `BADGE_TEMPLATE_FEATURE_${bf.id}_TEXT_COLOR`;
            const badgeTemplateFeatureFontSize = `BADGE_TEMPLATE_FEATURE_${bf.id}_FONT_SIZE`;
            const badgeTemplateFeatureDisplay = `BADGE_TEMPLATE_FEATURE_${bf.id}_DISPLAY`;
            return (
              <Panel
                key={bf.name}
                show={showSection === bf.name}
                title={bf.name}
                handleClick={this.toggleSection.bind(this, bf.name)}
              >
                <div className="form-group">
                  <div className="row">
                    <div className="col-md-6">
                      <label>
                        {T.translate(
                          "badge_settings.badge_template_feature_top"
                        )}{" "}
                        &nbsp;{" "}
                        <i
                          className="fa fa-info-circle"
                          aria-hidden="true"
                          title={T.translate(
                            "badge_settings.px_percentage_info"
                          )}
                        />
                      </label>
                      <br />
                      <Input
                        className="form-control"
                        id={badgeTemplateFeatureTop}
                        value={entity?.[badgeTemplateFeatureTop]?.value}
                        onChange={this.handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label>
                        {T.translate(
                          "badge_settings.badge_template_feature_left"
                        )}{" "}
                        &nbsp;{" "}
                        <i
                          className="fa fa-info-circle"
                          aria-hidden="true"
                          title={T.translate(
                            "badge_settings.px_percentage_info"
                          )}
                        />
                      </label>
                      <br />
                      <Input
                        className="form-control"
                        id={badgeTemplateFeatureLeft}
                        value={entity?.[badgeTemplateFeatureLeft]?.value}
                        onChange={this.handleChange}
                      />
                    </div>
                  </div>
                  <br />
                  <div className="row">
                    <div className="col-md-6">
                      <label>
                        {T.translate(
                          "badge_settings.badge_template_feature_display_type"
                        )}
                      </label>
                      <br />
                      <Dropdown
                        id={badgeTemplateFeatureDisplayMode}
                        value={entity?.[badgeTemplateFeatureDisplayMode]?.value}
                        onChange={this.handleChange}
                        options={[
                          { label: "Text", value: "TEXT" },
                          { label: "Image", value: "IMAGE" }
                        ]}
                        isClearable
                      />
                    </div>
                    <div className="col-md-6">
                      <label>
                        {T.translate(
                          "badge_settings.badge_template_feature_display"
                        )}
                      </label>
                      <br />
                      <Switch
                        id={badgeTemplateFeatureDisplay}
                        checked={
                          entity?.[badgeTemplateFeatureDisplay]?.value || false
                        }
                        onChange={(val) => {
                          this.handleOnSwitchChange(
                            badgeTemplateFeatureDisplay,
                            val
                          );
                        }}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        className="react-switch"
                      />
                    </div>
                  </div>
                  {entity?.[badgeTemplateFeatureDisplayMode]?.value ===
                    "TEXT" && (
                    <>
                      <br />
                      <div className="row">
                        <div className="col-md-6">
                          <label>
                            {T.translate(
                              "badge_settings.badge_template_feature_font_size"
                            )}
                          </label>
                          <br />
                          <Input
                            id={badgeTemplateFeatureFontSize}
                            value={
                              entity?.[badgeTemplateFeatureFontSize]?.value
                            }
                            onChange={this.handleChange}
                            className="form-control"
                          />
                        </div>
                        <div className="col-md-6">
                          <label>
                            {T.translate(
                              "badge_settings.badge_template_feature_text_color"
                            )}
                          </label>
                          <br />
                          <HexColorInput
                            id={badgeTemplateFeatureTextColor}
                            value={
                              entity?.[badgeTemplateFeatureTextColor]?.value
                            }
                            onChange={this.handleChange}
                            className="form-control"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>

        <hr />
        <div className="row form-group">
          <div className="col-md-12">
            <h3>{T.translate("badge_settings.badge_types")}</h3>
            {/* BADGE_TEMPLATE_TYPE_<TYPE_ID>_BACKGROUND_IMG ( url to file image at a CDN ). */}
            {currentSummit.badge_types.map((bt) => {
              const badgeTemplateTypeBackgroundImg = `BADGE_TEMPLATE_TYPE_${bt.id}_BACKGROUND_IMG`;
              return (
                <Panel
                  key={bt.name}
                  show={showSection === bt.name}
                  title={bt.name}
                  handleClick={this.toggleSection.bind(this, bt.name)}
                >
                  <div className="form-group">
                    <div className="row">
                      <div className="col-md-12">
                        <label>
                          {badgeTemplateTypeBackgroundImg} &nbsp;{" "}
                          <i
                            className="fa fa-info-circle"
                            aria-hidden="true"
                            title={T.translate("badge_settings.url_info")}
                          />
                        </label>
                        <br />
                        <UploadInput
                          id={badgeTemplateTypeBackgroundImg}
                          value={
                            entity?.[badgeTemplateTypeBackgroundImg]
                              ?.file_preview ||
                            entity?.[badgeTemplateTypeBackgroundImg]?.file
                          }
                          handleUpload={this.handleUploadFile}
                          handleRemove={() =>
                            this.handleRemoveFile(
                              badgeTemplateTypeBackgroundImg
                            )
                          }
                          className="dropzone col-md-6"
                          multiple={false}
                        />
                      </div>
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>

        <div className="row">
          <div className="col-md-12 submit-buttons">
            <input
              type="button"
              onClick={this.handleSubmit}
              className="btn btn-primary pull-right"
              value={T.translate("general.save")}
            />
          </div>
        </div>
      </form>
    );
  }
}

export default BadgeSettingsForm;
