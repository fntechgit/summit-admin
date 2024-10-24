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

    const newEntity = { ...this.state.entity };

    newEntity[id].file = file;
    newEntity[id].file_preview = file.preview;

    this.setState({ entity: newEntity });
  }

  handleRemoveFile(ev, data) {
    const { id } = data;
    const newEntity = { ...this.state.entity };

    newEntity[id].file_preview = "";

    if (newEntity[id].id) {
      newEntity[id].file = "";
      this.props.onDeleteImage(newEntity[id].id);
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

    console.log("CHECK!", setting, value, newEntity[setting], newEntity);

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

    console.log("CHECKING...", settingsToSave);
    console.log("CHECKING...", this.state.entity);

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
              handleRemove={this.handleRemoveFile}
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
            <label>
              {T.translate("badge_settings.badge_template_first_name_top")}{" "}
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
              id="BADGE_TEMPLATE_FIRST_NAME_TOP"
              value={entity?.BADGE_TEMPLATE_FIRST_NAME_TOP?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_first_name_left")}{" "}
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
              id="BADGE_TEMPLATE_FIRST_NAME_LEFT"
              value={entity?.BADGE_TEMPLATE_FIRST_NAME_LEFT?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_last_name_top")}{" "}
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
              id="BADGE_TEMPLATE_LAST_NAME_TOP"
              value={entity?.BADGE_TEMPLATE_LAST_NAME_TOP?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_last_name_left")}{" "}
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
              id="BADGE_TEMPLATE_LAST_NAME_LEFT"
              value={entity?.BADGE_TEMPLATE_LAST_NAME_LEFT?.value}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="row form-group">
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_company_top")} &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_COMPANY_TOP"
              value={entity?.BADGE_TEMPLATE_COMPANY_TOP?.value}
              onChange={this.handleChange}
            />
          </div>
          <div className="col-md-6">
            <label>
              {T.translate("badge_settings.badge_template_company_left")} &nbsp;{" "}
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("badge_settings.px_percentage_info")}
              />
            </label>
            <br />
            <Input
              className="form-control"
              id="BADGE_TEMPLATE_COMPANY_LEFT"
              value={entity?.BADGE_TEMPLATE_COMPANY_LEFT?.value}
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
        </div>

        <div className="row form-group">
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
          </div>
          {currentSummit.badge_features_types.map((bf) => {
            const badgeTemplateFeatureTop = `BADGE_TEMPLATE_FEATURE_${bf.id}_TOP`;
            const badgeTemplateFeatureLeft = `BADGE_TEMPLATE_FEATURE_${bf.id}_LEFT`;
            const badgeTemplateFeatureDisplayType = `BADGE_TEMPLATE_FEATURE_${bf.id}_DISPLAY_TYPE`;
            const badgeTemplateFeatureTextColor = `BADGE_TEMPLATE_FEATURE_${bf.id}_TEXT_COLOR`;
            const badgeTemplateFeatureDisplay = `BADGE_TEMPLATE_FEATURE_${bf.id}_DISPLAY`;
            return (
              <Panel
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
                        id={badgeTemplateFeatureDisplayType}
                        value={entity?.[badgeTemplateFeatureDisplayType]?.value}
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
                  {entity?.[badgeTemplateFeatureDisplayType]?.value ===
                    "TEXT" && (
                    <>
                      <br />
                      <div className="row">
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
                        <Input
                          className="form-control"
                          id={badgeTemplateTypeBackgroundImg}
                          value={
                            entity?.[badgeTemplateTypeBackgroundImg]?.value
                          }
                          onChange={this.handleChange}
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
