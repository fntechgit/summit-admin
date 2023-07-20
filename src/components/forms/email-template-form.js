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

import React, { useState, useEffect } from 'react'
import T from 'i18n-react/dist/i18n-react'
import 'awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css'
import { Dropdown, Input } from 'openstack-uicore-foundation/lib/components'
import EmailTemplateInput from '../inputs/email-template-input'
import CodeMirror from '@uiw/react-codemirror';
import { sublime, sublimeInit } from '@uiw/codemirror-theme-sublime';
import { html } from '@codemirror/lang-html';
import mjml2html from 'mjml-browser';
import { isEmpty, scrollToError, shallowEqual, hasErrors } from "../../utils/methods";

const EmailTemplateForm = ({ entity, errors, clients, preview, onSubmit, onRender }) => {

    const [stateEntity, setStateEntity] = useState(entity);
    const [stateErrors, setStateErrors] = useState(errors);
    const [mjmlEditor, setMjmlEditor] = useState(entity.mjml_content ? true : false);
    const [mobileView, setMobileView] = useState(false);

    let style = mobileView
        ? { width: '320px', height: '640px' }
        : { width: '1024px', height: '768px' };

    // constructor(props) {
    //     super(props);

    //     this.state = {
    //         entity: {...props.entity},
    //         errors: props.errors,
    //         mjml_editor: true,
    //         mobileView: false,
    //     };

    //     this.handleChange = this.handleChange.bind(this);
    //     this.handleSubmit = this.handleSubmit.bind(this);
    //     this.handlePreview = this.handlePreview.bind(this);
    //     this.handleCodeMirrorChange = this.handleCodeMirrorChange.bind(this);
    // }

    // componentDidUpdate(prevProps, prevState, snapshot) {
    //     const state = {};
    //     scrollToError(this.props.errors);

    //     if(!shallowEqual(prevProps.entity, this.props.entity)) {
    //         state.entity = {...this.props.entity};
    //         state.errors = {};
    //     }

    //     if (!shallowEqual(prevProps.errors, this.props.errors)) {
    //         state.errors = {...this.props.errors};
    //     }

    //     if (!isEmpty(state)) {
    //         this.setState({...this.state, ...state})
    //     }
    // }

    useEffect(() => {
        if (mjmlEditor) {
            try {
                const htmlContent = mjml2html(stateEntity.mjml_content, {
                    keepComments: false,
                    collapseWhitespace: true,
                    minifyOptions: { collapseWhitespace: false }
                }).html;
                setStateEntity({ ...stateEntity, html_content: htmlContent })
            } catch (err) {
                console.log('error mjml to html', err)
            }
        }
    }, [stateEntity.mjml_content])

    const handleCodeMirrorHTMLChange = (value, change) => {
        setStateErrors({ ...stateErrors, ['html_content']: '' });
        setStateEntity({ ...stateEntity, ['html_content']: value });
    }

    const handleCodeMirrorMJMLChange = (value, change) => {
        setStateErrors({ ...stateErrors, ['mjml_content']: '' });
        setStateEntity({ ...stateEntity, ['mjml_content']: value });
    }

    const handleChange = (ev) => {
        let { value, id } = ev.target;

        if (ev.target.type === 'checkbox') {
            value = ev.target.checked;
        }

        if (ev.target.type === 'number') {
            value = parseInt(ev.target.value);
        }

        setStateEntity({ ...stateEntity, [id]: value })
        setStateErrors({ ...stateErrors, [id]: '' })
    }

    const handleSubmit = (ev) => {
        ev.preventDefault();

        onSubmit(stateEntity);
    }

    const handlePreview = (ev) => {
        ev.preventDefault();

        onSubmit(stateEntity, true);
        onRender();
    }


    const email_clients_ddl = clients ? clients.map(cli => ({ label: cli.name, value: cli.id })) : [];

    return (
        <form className="email-template-form">
            <input type="hidden" id="id" value={stateEntity.id} />
            <div className="row form-group">
                <div className="col-md-4">
                    <label> {T.translate("emails.name")} *</label>
                    <Input
                        id="identifier"
                        value={stateEntity.identifier}
                        onChange={handleChange}
                        className="form-control"
                        error={hasErrors('identifier', errors)}
                    />
                </div>
                <div className="col-md-4">
                    <label> {T.translate("emails.client")} *</label>
                    <Dropdown
                        id="allowed_clients"
                        value={stateEntity.allowed_clients}
                        placeholder={T.translate("emails.placeholders.select_client")}
                        options={email_clients_ddl}
                        onChange={handleChange}
                        isMulti
                    />
                </div>
                <div className="col-md-4">
                    <label> {T.translate("emails.parent")} *</label>
                    <EmailTemplateInput
                        id="parent"
                        value={stateEntity.parent}
                        ownerId={stateEntity.id}
                        placeholder={T.translate("emails.placeholders.select_parent")}
                        onChange={handleChange}
                    />
                </div>
            </div>
            <div className="row form-group">
                <div className="col-md-4">
                    <label> {T.translate("emails.from_email")} *</label>
                    <Input
                        id="from_email"
                        value={stateEntity.from_email}
                        onChange={handleChange}
                        className="form-control"
                        error={hasErrors('from_email', errors)}
                    />
                </div>
                <div className="col-md-4">
                    <label> {T.translate("emails.subject")} *</label>
                    <Input
                        id="subject"
                        value={stateEntity.subject}
                        onChange={handleChange}
                        className="form-control"
                        error={hasErrors('subject', errors)}
                    />
                </div>
                <div className="col-md-4">
                    <label> {T.translate("emails.max_retries")} *</label>
                    <Input
                        id="max_retries"
                        type="number"
                        value={stateEntity.max_retries}
                        onChange={handleChange}
                        className="form-control"
                        error={hasErrors('max_retries', errors)}
                    />
                </div>
            </div>
            <div className="row form-group">
                <div className="col-md-12">
                    <input type="button" onClick={() => setMjmlEditor(true)}
                        className={`btn btn-primary ${mjmlEditor ? 'active' : null}`} value={T.translate("emails.display_mjml")} />
                    {` `}
                    <input type="button" onClick={() => setMjmlEditor(false)}
                        className={`btn btn-primary ${!mjmlEditor ? 'active' : null}`} value={T.translate("emails.display_html")} />
                </div>
                <div className="col-md-12">
                    {mjmlEditor ?
                        <>
                            <label>
                                {T.translate("emails.mjml_content")}
                                {' using '}
                                <a href="https://documentation.mjml.io/">
                                    MJML format
                                </a>
                            </label>
                            <CodeMirror
                                id="mjml_content"
                                value={stateEntity.mjml_content}
                                onChange={(value, viewUpdate) => handleCodeMirrorMJMLChange(value, viewUpdate)}
                                height="650px"
                                theme={sublimeInit({
                                    settings: {
                                        caret: '#c6c6c6',
                                        fontFamily: 'monospace',
                                    }
                                })}
                                extensions={[html({ autoCloseTags: true, matchClosingTags: true, selfClosingTags: true })]}
                            />
                        </>
                        :
                        <>
                            <label>
                                {T.translate("emails.html_content")}
                                {' in '}
                                <a href="https://opensource.com/sites/default/files/gated-content/osdc_cheatsheet-jinja2.pdf">
                                    jinja format
                                </a>
                                {' *'}
                            </label>
                            <CodeMirror
                                id="html_content"
                                value={stateEntity.html_content}
                                onChange={(value, viewUpdate) => handleCodeMirrorHTMLChange(value, viewUpdate)}
                                height="650px"
                                theme={sublimeInit({
                                    settings: {
                                        caret: '#c6c6c6',
                                        fontFamily: 'monospace',
                                    }
                                })}
                                extensions={[html({ autoCloseTags: true, matchClosingTags: true, selfClosingTags: true })]}
                            />
                        </>
                    }
                </div>
            </div>
            {preview &&
                <div className="row form-group">
                    <div className="col-md-12">
                        <>
                            <input type="button" onClick={() => setMobileView(!mobileView)}
                                className={`btn btn-primary`} value={mobileView ? T.translate("emails.display_desktop") : T.translate("emails.display_mobile")} />
                            <br/><br/>
                            <iframe
                                style={{ ...style, border: '1px solid #ccc' }}
                                id={'preview'}
                                name={'preview'}
                                sandbox={'allow-same-origin'}
                                srcDoc={preview}
                            />
                        </>
                    </div>
                </div>
            }
            <div className="row">
                <div className="col-md-12 submit-buttons">
                    <input type="button" onClick={handleSubmit}
                        className="btn btn-primary pull-right" value={T.translate("general.save")} />
                    <input type="button" onClick={handlePreview} disabled={!stateEntity.id}
                        className="btn btn-primary pull-right" value={T.translate("emails.preview")} />
                    {/*<input type="button" onClick={this.handleSendTest}
                            className="btn btn-primary pull-right" value={T.translate("emails.send_test")}/>*/}
                </div>
            </div>
        </form>
    );
}

export default EmailTemplateForm;
