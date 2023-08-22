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

import React, { useState, useEffect, useRef, useCallback } from 'react'
import T from 'i18n-react/dist/i18n-react'
import 'awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css'
import _ from 'lodash';
import { AjaxLoader, Dropdown, Input } from 'openstack-uicore-foundation/lib/components'
import EmailTemplateInput from '../inputs/email-template-input'
import CodeMirror from '@uiw/react-codemirror';
import { sublime, sublimeInit } from '@uiw/codemirror-theme-sublime';
import { html } from '@codemirror/lang-html';
import mjml2html from 'mjml-browser';
import { isEmpty, scrollToError, shallowEqual, hasErrors } from "../../utils/methods";

import './email-template.less'

const default_mjml_content = `
### Sample MJML Code
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-image width="100px" src="/assets/img/logo-small.png"></mj-image>
        <mj-divider border-color="#F45E43"></mj-divider>
        <mj-text font-size="20px" color="#F45E43" font-family="helvetica">Hello World</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

const EmailTemplateForm = ({ entity, match, errors, clients, preview, templateLoading, renderErrors, onSubmit, onRender, templateJsonData, previewEmailTemplate }) => {

    const [stateEntity, setStateEntity] = useState({ ...entity });
    const [stateErrors, setStateErrors] = useState(errors);
    const [mjmlEditor, setMjmlEditor] = useState(null);
    const [codeOnly, setCodeOnly] = useState(false);
    const [previewOnly, setPreviewOnly] = useState(false);
    const [mobileView, setMobileView] = useState(false);
    const [scale, setScale] = useState(1)
    const [singleTab, setSingleTab] = useState(false);
    const [templateLoaded, setTemplateLoaded] = useState(false);
    const [previewLoaded, setPreviewLoaded] = useState(false);

    const previewRef = useRef(null);

    let style = mobileView
        ? { width: '320px', height: `960px`, transform: `scale(${scale})` }
        : { width: '800px', height: `960px`, transform: `scale(${scale})` };

    useEffect(() => {

        scrollToError(errors);

        // check if the current entity is sync with template_id param
        const templateId = match.params.template_id;
        if (parseInt(templateId) === entity.id || (entity.id === 0 && !templateId)) {
            setTemplateLoaded(true);
        }        

        if (!shallowEqual(stateErrors, errors)) {
            setStateErrors({ ...errors })
        }

    }, [errors, entity]);

    useEffect(() => {
        // if entity is correctly loaded, set state for entity use
        if(templateLoaded) {
            if (!entity.mjml_content) {
                setStateEntity({...entity, mjml_content: default_mjml_content})
            } else {                
                setStateEntity({ ...entity })
            }
            setStateErrors({})
            setMjmlEditor(entity.mjml_content.length > 0 ? true : entity.html_content ? false : true);
        }
    }, [templateLoaded]);    

    useEffect(() => {
        if (singleTab) {
            setCodeOnly(true);
        } else {
            setCodeOnly(false);
            setPreviewOnly(false);
        }
    }, [singleTab]);

    const debouncedRenderTemplate = useRef(
        _.debounce(async (htmlContent) => {
            previewEmailTemplate(entity.id, templateJsonData, htmlContent).then(() => {
                // wait until first API email preview to display template on screen
                if (!previewLoaded) setPreviewLoaded(true)
            });
        }, 500)
    ).current;

    useEffect(() => {
        debouncedRenderTemplate(stateEntity.html_content);
    }, [stateEntity.html_content, debouncedRenderTemplate])

    useEffect(() => {
        previewEmailTemplate(entity.id, templateJsonData, stateEntity.html_content);
    }, [templateJsonData]);

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

    const handleJsonDataEdit = (ev) => {
        ev.preventDefault();

        onRender()
    }

    const handleResizeWindow = () => {
        if (window.innerWidth < 992) {
            setSingleTab(true)
        } else {
            setSingleTab(false)
        };
        const currentPreviewWidth = previewRef?.current?.offsetWidth;
        if (mobileView) {
            if (currentPreviewWidth < 320) {
                const newScale = (currentPreviewWidth / 320);
                setScale(newScale);
            }
        } else {
            if (currentPreviewWidth < 800) {
                const newScale = (currentPreviewWidth / 800);
                setScale(newScale);
            }
        }
    }

    const handleTabChange = (ev) => {
        const { id } = ev.target;
        if (singleTab) {
            if (id === 'preview') {
                setCodeOnly(false);
                setPreviewOnly(true);
            } else {
                setCodeOnly(true);
                setPreviewOnly(false);
            }
        } else {
            id === 'preview' ?
                codeOnly ? setCodeOnly(false) : setPreviewOnly(true)
                :
                previewOnly ? setPreviewOnly(false) : setCodeOnly(true)
        }
    }

    useEffect(() => {
        handleResizeWindow();
        window.addEventListener("resize", handleResizeWindow);
        return () => {
            window.removeEventListener("resize", handleResizeWindow);
        };
    });


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
                    <input type="button" onClick={handleJsonDataEdit} disabled={!stateEntity.id}
                        className="btn btn-primary pull-right" value={T.translate("emails.edit_json")} />
                </div>
                <div className="col-md-12">
                    {templateLoaded ? 
                        <div className='email-template-container'>
                            <div className='email-template-buttons'>
                                {!previewOnly &&
                                    <div>
                                        {mjmlEditor ?
                                            <>
                                                <label>
                                                    {T.translate("emails.mjml_content")}
                                                    {' using '}
                                                    <a target="_blank" href="https://documentation.mjml.io/">
                                                        MJML format
                                                    </a>
                                                </label>
                                                <br />
                                                <input type="button" onClick={() => { setMjmlEditor(false) }}
                                                    className={`btn btn-primary`} value={T.translate("emails.display_html")} />
                                            </>
                                            :
                                            <>
                                                <label>
                                                    {T.translate("emails.html_content")}
                                                    {' in '}
                                                    <a target="_blank" href="https://opensource.com/sites/default/files/gated-content/osdc_cheatsheet-jinja2.pdf">
                                                        jinja format
                                                    </a>
                                                    {' *'}
                                                </label>
                                                <br />
                                                <input type="button" onClick={() => { setMjmlEditor(true) }}
                                                    className={`btn btn-primary`} value={T.translate("emails.display_mjml")} />
                                            </>
                                        }
                                    </div>
                                }
                                {!codeOnly &&
                                    <div>
                                        <label>
                                            {T.translate("emails.preview_title")}
                                        </label>
                                        <br />
                                        <input type="button" onClick={() => setMobileView(!mobileView)}
                                            className={`btn btn-primary`} value={mobileView ? T.translate("emails.display_desktop") : T.translate("emails.display_mobile")} />
                                    </div>
                                }
                            </div>
                            <br />
                            <div className='email-template-content'>
                                {!previewOnly &&
                                    <div className='email-template-code'>
                                        {mjmlEditor ?
                                            <CodeMirror
                                                id="mjml_content"
                                                value={stateEntity.mjml_content}
                                                onChange={(value, viewUpdate) => handleCodeMirrorMJMLChange(value, viewUpdate)}
                                                height='960px'
                                                theme={sublimeInit({
                                                    settings: {
                                                        caret: '#c6c6c6',
                                                        fontFamily: 'monospace',
                                                    }
                                                })}
                                                extensions={[html({ autoCloseTags: true, matchClosingTags: true, selfClosingTags: true })]}
                                            />
                                            :
                                            <CodeMirror
                                                id="html_content"
                                                value={stateEntity.html_content}
                                                onChange={(value, viewUpdate) => handleCodeMirrorHTMLChange(value, viewUpdate)}
                                                height='960px'
                                                theme={sublimeInit({
                                                    settings: {
                                                        caret: '#c6c6c6',
                                                        fontFamily: 'monospace',
                                                    }
                                                })}
                                                extensions={[html({ autoCloseTags: true, matchClosingTags: true, selfClosingTags: true })]}
                                            />
                                        }
                                    </div>
                                }
                                <div className={`email-template-content-buttons ${previewOnly || codeOnly ? 'single-button' : ''}`}>
                                    {!codeOnly &&
                                        <button type="button" id="code" onClick={(ev) => handleTabChange(ev)}>
                                            <i className="fa fa-chevron-right"></i>
                                        </button>

                                    }
                                    {!previewOnly &&
                                        <button type="button" id="preview" onClick={(ev) => handleTabChange(ev)}>
                                            <i className="fa fa-chevron-left"></i>
                                        </button>
                                    }
                                </div>
                                {!codeOnly &&
                                    <>                                        
                                        <div className='email-template-preview' ref={previewRef}>
                                            <AjaxLoader show={templateLoading} size={120} relative={true} />
                                            {renderErrors.length > 0 ?
                                                <div className='container'>
                                                    There is an error trying to render the email template:
                                                    <ul>
                                                        {renderErrors.map(err => (
                                                            <li>{err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                :
                                                previewLoaded &&
                                                    <iframe
                                                        style={{ ...style }}
                                                        id={'preview'}
                                                        name={'preview'}
                                                        sandbox={'allow-same-origin'}
                                                        srcDoc={preview}
                                                    />
                                            }
                                        </div>
                                    </>
                                }
                            </div>
                        </div>
                        :
                        <div>Loading template...</div>
                    }
                </div>
            </div>
            <div className="row">
                <div className="col-md-12 submit-buttons">
                    <input type="button" onClick={handleSubmit}
                        className="btn btn-primary pull-right" value={T.translate("general.save")} />
                    {/*<input type="button" onClick={this.handleSendTest}
                            className="btn btn-primary pull-right" value={T.translate("emails.send_test")}/>*/}
                </div>
            </div>
        </form>
    );
}

export default EmailTemplateForm;
