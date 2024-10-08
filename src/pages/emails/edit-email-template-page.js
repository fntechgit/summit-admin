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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import { Modal } from "react-bootstrap";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { sublimeInit } from "@uiw/codemirror-theme-sublime";
import { getSummitById } from "../../actions/summit-actions";
import EmailTemplateForm from "../../components/forms/email-template-form";
import AddNewButton from "../../components/buttons/add-new-button";
import { DECIMAL_DIGITS } from "../../utils/constants";
import {
  getEmailTemplate,
  resetTemplateForm,
  saveEmailTemplate,
  getAllClients,
  renderEmailTemplate,
  updateTemplateJsonData
} from "../../actions/email-actions";

import "../../styles/edit-email-template-page.less";

class EditEmailTemplatePage extends React.Component {
  constructor(props) {
    super(props);

    const { json_data } = props;

    this.state = {
      showModal: false,
      json_data,
      json_preview: json_data
    };

    this.handlePreview = this.handlePreview.bind(this);
    this.handleJsonChange = this.handleJsonChange.bind(this);
    this.handlePopupClose = this.handlePopupClose.bind(this);
  }

  componentDidMount() {
    const { match } = this.props;
    const templateId = match.params.template_id;

    if (!templateId) {
      this.props.resetTemplateForm();
    } else {
      this.props.getEmailTemplate(templateId);
    }

    this.props.getAllClients();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldId = prevProps.match.params.template_id;
    const newId = this.props.match.params.template_id;

    if (oldId !== newId) {
      if (!newId) {
        this.props.resetTemplateForm();
      } else {
        this.props.getEmailTemplate(newId);
      }
    }
  }

  handleJsonChange(value, changes) {
    this.setState({ json_preview: value });
  }

  handlePopupClose() {
    const { json_preview } = this.state;
    const parsedJSON = JSON.parse(json_preview);
    this.props
      .updateTemplateJsonData(parsedJSON)
      .then(() =>
        this.setState({ showModal: false, json_data: parsedJSON, json_preview })
      );
  }

  handlePreview() {
    const { json_data } = this.state;
    this.setState({
      ...this.state,
      showModal: true,
      json_preview: JSON.stringify(json_data, null, DECIMAL_DIGITS)
    });
  }

  render() {
    const {
      currentSummit,
      entity,
      templateLoading,
      errors,
      match,
      clients,
      preview,
      render_errors
    } = this.props;
    const { showModal, json_preview, json_data } = this.state;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    const breadcrumb = entity.id
      ? entity.identifier
      : T.translate("general.new");

    return (
      <div
        className="edit-template-page"
        style={{
          backgroundColor: "white",
          padding: "2vh 2vw",
          margin: "2vh 2vw"
        }}
      >
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <h3>
          {title} {T.translate("emails.email_template")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        <EmailTemplateForm
          match={match}
          currentSummit={currentSummit}
          entity={entity}
          clients={clients}
          errors={errors}
          onSubmit={this.props.saveEmailTemplate}
          onRender={this.handlePreview}
          preview={preview}
          renderErrors={render_errors}
          templateLoading={templateLoading}
          templateJsonData={json_data}
          renderEmailTemplate={this.props.renderEmailTemplate}
        />
        <Modal
          className="preview-email-template-modal"
          show={showModal}
          onHide={() => {
            this.setState({ ...this.state, showModal: false });
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title>{T.translate("emails.sample_data")}</Modal.Title>
            <span>{T.translate("emails.sample_data_legend")}</span>
          </Modal.Header>
          <Modal.Body style={{ overflow: "auto", maxHeight: "75vh" }}>
            {render_errors?.length > 0 && (
              <div className="row">
                <div className="col-md-12 error">{render_errors}</div>
              </div>
            )}
            <div className="row">
              <div className="col-md-12">
                <label>
                  {" "}
                  JSON{" "}
                  <a
                    href="https://jsonformatter.curiousconcept.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    format
                  </a>
                </label>
                <CodeMirror
                  id="json_preview"
                  value={json_preview}
                  onChange={(value, viewUpdate) =>
                    this.handleJsonChange(value, viewUpdate)
                  }
                  theme={sublimeInit({
                    settings: {
                      caret: "#c6c6c6",
                      fontFamily: "monospace"
                    }
                  })}
                  extensions={[json()]}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-primary" onClick={this.handlePopupClose}>
              {T.translate("emails.update")}
            </button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = ({ currentSummitState, emailTemplateState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...emailTemplateState
});

export default connect(mapStateToProps, {
  getSummitById,
  getEmailTemplate,
  resetTemplateForm,
  saveEmailTemplate,
  getAllClients,
  renderEmailTemplate,
  updateTemplateJsonData
})(EditEmailTemplatePage);
