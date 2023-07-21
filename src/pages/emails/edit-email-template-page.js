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
 **/

import React from 'react'
import { connect } from 'react-redux';
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from 'react-breadcrumbs';
import EmailTemplateForm from '../../components/forms/email-template-form';
import { getSummitById } from '../../actions/summit-actions';
import { RawHTML } from 'openstack-uicore-foundation/lib/components';
import { getEmailTemplate, resetTemplateForm, saveEmailTemplate, getAllClients, previewEmailTemplate } from "../../actions/email-actions";
import { Modal } from "react-bootstrap";

import '../../styles/edit-email-template-page.less';
import CodeMirror from '@uiw/react-codemirror';
import { sublime, sublimeInit } from '@uiw/codemirror-theme-sublime';
import { json } from '@codemirror/lang-json';
import { formatInitialJson } from '../../utils/methods';

import emailTemplateDefaultValues from '../../data/email_template_variables_sample.json';

class EditEmailTemplatePage extends React.Component {

    constructor(props) {
        const { clients, match } = props;
        const templateId = match.params.template_id;

        super(props);

        this.state = {
            showModal: false,
            json_preview: emailTemplateDefaultValues
        };

        if (!templateId) {
            props.resetTemplateForm();
        } else {
            props.getEmailTemplate(templateId);
        }

        if (!clients) {
            props.getAllClients();
        }

        this.handleRender = this.handleRender.bind(this);
        this.handlePreview = this.handlePreview.bind(this);
        this.handleJsonChange = this.handleJsonChange.bind(this);
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

    handleRender() {
        const { entity, render_errors } = this.props;
        const { json_preview } = this.state;
        this.props.previewEmailTemplate(entity.id, json_preview).then(() => this.setState({ showModal: render_errors.length > 0 ? true : false }));
    }

    handlePreview() {
        this.setState({ showModal: true });
        this.setState({ json_preview: JSON.stringify(emailTemplateDefaultValues, null, 2) });
    }

    render() {
        const { currentSummit, entity, errors, match, clients, preview, render_errors } = this.props;
        const { showModal, json_preview } = this.state;
        const title = (entity.id) ? T.translate("general.edit") : T.translate("general.add");
        const breadcrumb = (entity.id) ? entity.identifier : T.translate("general.new");

        return (
            <div className="container edit-template-page">
                <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
                <h3>{title} {T.translate("emails.email_template")}</h3>
                <hr />
                <EmailTemplateForm
                    currentSummit={currentSummit}
                    entity={entity}
                    clients={clients}
                    errors={errors}
                    onSubmit={this.props.saveEmailTemplate}
                    onRender={this.handlePreview}
                    preview={preview}
                />
                <Modal className="preview-email-template-modal" show={showModal} onHide={() => { this.setState({ showModal: false }) }} >
                    <Modal.Header closeButton>
                        <Modal.Title>{T.translate("emails.preview")}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {render_errors.length > 0 &&
                            <div className="row">
                                <div className="col-md-12 error">
                                    {render_errors}
                                </div>
                            </div>
                        }
                        <div className="row">
                            <div className="col-md-12">
                                <label> JSON <a href="https://jsonformatter.curiousconcept.com/" target="_blank">format</a></label>
                                <CodeMirror
                                    id="json_preview"
                                    value={json_preview}
                                    onChange={(value, viewUpdate) => this.handleJsonChange(value, viewUpdate)}
                                    theme={sublimeInit({
                                        settings: {
                                            caret: '#c6c6c6',
                                            fontFamily: 'monospace',
                                        },
                                    })}
                                    extensions={[json()]}
                                />
                            </div>
                            {/*
                            <br />
                            <br />
                            <div className="col-md-12">
                                <label> {T.translate("emails.preview")} </label>
                                <div className="email-preview">
                                    {preview && <RawHTML>{preview}</RawHTML>}                                    
                                </div>

                            </div> */}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <button className="btn btn-primary" onClick={this.handleRender}>
                            {T.translate("emails.render")}
                        </button>
                    </Modal.Footer>
                </Modal>
            </div>

        )
    }
}

const mapStateToProps = ({ currentSummitState, emailTemplateState }) => ({
    currentSummit: currentSummitState.currentSummit,
    ...emailTemplateState
});

export default connect(
    mapStateToProps,
    {
        getSummitById,
        getEmailTemplate,
        resetTemplateForm,
        saveEmailTemplate,
        getAllClients,
        previewEmailTemplate
    }
)(EditEmailTemplatePage);
