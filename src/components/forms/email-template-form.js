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

import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle
} from "react";
import T from "i18n-react/dist/i18n-react";
import debounce from "lodash/debounce";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import CodeMirror from "@uiw/react-codemirror";
import { sublimeInit } from "@uiw/codemirror-theme-sublime";
import { html } from "@codemirror/lang-html";
import mjml2html from "mjml-browser";
import showConfirmDialog from "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog";
import EmailTemplateInput from "../inputs/email-template-input";
import { scrollToError, shallowEqual, hasErrors } from "../../utils/methods";
import "./email-template.less";
import {
  EMAIL_TEMPLATE_TYPE_HTML,
  EMAIL_TEMPLATE_TYPE_MJML
} from "../../utils/constants";

const default_mjml_content = `
### Sample MJML Code
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-image width="100px"></mj-image>
        <mj-divider border-color="#F45E43"></mj-divider>
        <mj-text font-size="20px" color="#F45E43" font-family="helvetica">Hello World</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

const EmailTemplateForm = forwardRef(
  (
    {
      entity,
      errors,
      clients,
      preview,
      templateLoading,
      renderErrors,
      onSubmit,
      onRender,
      templateJsonData,
      renderEmailTemplate,
      onValidityChange
    },
    ref
  ) => {
    const [stateEntity, setStateEntity] = useState({ ...entity });
    const [stateErrors, setStateErrors] = useState(errors);
    const [historyVersion, setHistoryVersion] = useState("");
    const [currentVersionExternalLink, setCurrentVersionExternalLink] =
      useState(null);
    const [mjmlEditor, setMjmlEditor] = useState(null);
    const [codeOnly, setCodeOnly] = useState(false);
    const [previewOnly, setPreviewOnly] = useState(false);
    const [mobileView, setMobileView] = useState(false);
    const [scale, setScale] = useState(1);
    const [singleTab, setSingleTab] = useState(false);
    const [templateLoaded, setTemplateLoaded] = useState(false);
    const [previewLoaded, setPreviewLoaded] = useState(false);
    const [mjmlWarning, setMjmlWarning] = useState(false);
    const [mjmlRenderError, setMjmlRenderError] = useState(null);

    const previewRef = useRef(null);

    const style = mobileView
      ? { width: "320px", height: "960px", transform: `scale(${scale})` }
      : { width: "800px", height: "960px", transform: `scale(${scale})` };

    useEffect(() => {
      scrollToError(errors);

      setTemplateLoaded(true);

      if (!shallowEqual(stateErrors, errors)) {
        setStateErrors({ ...errors });
      }

      if (!shallowEqual(stateEntity, entity)) {
        setStateEntity({ ...entity });
      }
    }, [errors, entity]);

    useEffect(() => {
      // if entity is correctly loaded, set state for entity use
      if (templateLoaded) {
        if (entity.id === 0) {
          setStateEntity({ ...entity, mjml_content: default_mjml_content });
        } else {
          setStateEntity({ ...entity });
        }
        setStateErrors({});
        setMjmlEditor(
          entity.mjml_content.length > 0 ? true : !entity.html_content
        );
      }
    }, [templateLoaded, entity.id]);

    useEffect(() => {
      if (singleTab) {
        setCodeOnly(true);
      } else {
        setCodeOnly(false);
        setPreviewOnly(false);
      }
    }, [singleTab]);

    const DEBOUNCE_MS = 500;
    const debouncedRenderTemplate = useRef(
      debounce(async (content, json_data, isMjml) => {
        renderEmailTemplate(json_data, content, isMjml).then(() => {
          // wait until first API email preview to display template on screen
          if (!previewLoaded) setPreviewLoaded(true);
        });
      }, DEBOUNCE_MS)
    ).current;

    // MJML mode: send raw mjml_content so the API runs Jinja -> official MJML CLI
    // (same pipeline as production). mjmlEditor is in the deps so a button-only
    // mode switch re-fires this; the debounce coalesces with the HTML effect so
    // only one preview request goes out per mode.
    useEffect(() => {
      if (templateLoaded && mjmlEditor)
        debouncedRenderTemplate(
          stateEntity.mjml_content,
          templateJsonData,
          true
        );
    }, [stateEntity.mjml_content, mjmlEditor, entity, templateJsonData]);

    // HTML mode: unchanged Jinja-on-HTML preview. Guarded on !mjmlEditor so it
    // does not fire for MJML templates.
    useEffect(() => {
      if (templateLoaded && !mjmlEditor)
        debouncedRenderTemplate(
          stateEntity.html_content,
          templateJsonData,
          false
        );
    }, [stateEntity.html_content, mjmlEditor, entity, templateJsonData]);

    useEffect(() => {
      if (mjmlEditor) {
        try {
          const htmlContent = mjml2html(stateEntity.mjml_content, {
            validationLevel: "strict",
            keepComments: false,
            collapseWhitespace: true,
            minifyOptions: { collapseWhitespace: false }
          }).html;
          setStateEntity({ ...stateEntity, html_content: htmlContent });
          setMjmlRenderError(null);
        } catch (err) {
          setMjmlRenderError(err);
        }
      }
    }, [stateEntity.mjml_content, historyVersion]);

    useEffect(() => {
      if (
        entity.mjml_content.length === 0 &&
        entity.html_content.length > 0 &&
        mjmlEditor &&
        !mjmlWarning
      ) {
        showConfirmDialog({
          title: T.translate("general.are_you_sure"),
          text: T.translate("emails.mjml_warning"),
          iconType: "warning",
          confirmButtonColor: "error",
          confirmButtonText: T.translate("emails.understand")
        }).then((confirmed) => {
          if (confirmed) {
            setMjmlWarning(true);
          } else {
            setMjmlEditor(false);
          }
        });
      }
    }, [mjmlEditor]);

    const handleCodeMirrorHTMLChange = (value) => {
      setStateErrors({ ...stateErrors, html_content: "" });
      setStateEntity({ ...stateEntity, html_content: value });
    };

    const handleCodeMirrorMJMLChange = (value) => {
      setStateErrors({ ...stateErrors, mjml_content: "" });
      setStateEntity({ ...stateEntity, mjml_content: value });
    };

    const handleChange = (ev) => {
      let { value, id } = ev.target;

      if (ev.target.type === "checkbox") {
        value = ev.target.checked;
      }

      if (ev.target.type === "number") {
        value = parseInt(ev.target.value);
      }

      setStateEntity({ ...stateEntity, [id]: value });
      setStateErrors({ ...stateErrors, [id]: "" });
    };

    const handleClientsChange = (ev) => {
      setStateEntity({ ...stateEntity, allowed_clients: ev.target.value });
      setStateErrors({ ...stateErrors, allowed_clients: "" });
    };

    const handleJsonDataEdit = (ev) => {
      ev.preventDefault();
      onRender();
    };

    const SINGLE_TAB_BREAKPOINT = 992;
    const MOBILE_PREVIEW_WIDTH = 320;
    const DESKTOP_PREVIEW_WIDTH = 800;

    const handleResizeWindow = () => {
      if (window.innerWidth < SINGLE_TAB_BREAKPOINT) {
        setSingleTab(true);
      } else {
        setSingleTab(false);
      }
      const currentPreviewWidth = previewRef?.current?.offsetWidth;
      if (mobileView) {
        if (currentPreviewWidth < MOBILE_PREVIEW_WIDTH) {
          const newScale = currentPreviewWidth / MOBILE_PREVIEW_WIDTH;
          setScale(newScale);
        }
      } else if (currentPreviewWidth < DESKTOP_PREVIEW_WIDTH) {
        const newScale = currentPreviewWidth / DESKTOP_PREVIEW_WIDTH;
        setScale(newScale);
      }
    };

    const handleTabChange = (ev) => {
      const { id } = ev.target;
      if (singleTab) {
        if (id === "preview") {
          setCodeOnly(false);
          setPreviewOnly(true);
        } else {
          setCodeOnly(true);
          setPreviewOnly(false);
        }
      } else if (id === "preview") {
        if (codeOnly) {
          setCodeOnly(false);
        } else {
          setPreviewOnly(true);
        }
      } else if (previewOnly) {
        setPreviewOnly(false);
      } else {
        setCodeOnly(true);
      }
    };

    const handleVersionChange = (ev) => {
      const { value } = ev.target;
      if (!value) {
        // restore original version
        setStateEntity({
          ...stateEntity,
          html_content: stateEntity.original_html_content,
          mjml_content: stateEntity.original_mjml_content
        });
        setHistoryVersion("");
        setCurrentVersionExternalLink(null);
        return;
      }

      const selectedHistory = stateEntity.versions.find((h) => h.sha === value);
      setHistoryVersion(selectedHistory.sha);
      setCurrentVersionExternalLink(selectedHistory.html_url);
      if (selectedHistory.type === EMAIL_TEMPLATE_TYPE_HTML) {
        setMjmlEditor(false);
        setStateEntity({
          ...stateEntity,
          html_content: selectedHistory.content
        });
      }
      if (selectedHistory.type === EMAIL_TEMPLATE_TYPE_MJML) {
        setMjmlEditor(true);
        setStateEntity({
          ...stateEntity,
          mjml_content: selectedHistory.content
        });
      }
    };

    const isTemplateInvalid = () => mjmlEditor && mjmlRenderError !== null;

    useEffect(() => {
      onValidityChange?.(isTemplateInvalid());
    }, [mjmlEditor, mjmlRenderError]);

    useImperativeHandle(
      ref,
      () => ({
        submit: () => onSubmit(stateEntity)
      }),
      [stateEntity, onSubmit]
    );

    useEffect(() => {
      handleResizeWindow();
      window.addEventListener("resize", handleResizeWindow);
      return () => {
        window.removeEventListener("resize", handleResizeWindow);
      };
    });

    const email_clients_ddl = clients
      ? clients.map((cli) => ({ label: cli.name, value: cli.id }))
      : [];
    const versions_ddl = stateEntity.versions
      ? [
          { value: "", label: T.translate("emails.current_version") },
          ...stateEntity.versions.map((v) => ({
            label: `${epochToMomentTimeZone(v.commit_date, "UTC").format(
              "YYYY-MM-DD HH:mm z"
            )} - ${v.sha} - ${v.commit_message}`,
            value: v.sha
          }))
        ]
      : [];

    return (
      <form className="email-template-form">
        <input type="hidden" id="id" value={stateEntity.id} />
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <label> {T.translate("emails.name")} *</label>
            <TextField
              id="identifier"
              fullWidth
              size="small"
              value={stateEntity.identifier}
              onChange={handleChange}
              error={!!hasErrors("identifier", errors)}
              helperText={hasErrors("identifier", errors) || undefined}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <label> {T.translate("emails.client")} *</label>
            <MuiDropdown
              id="allowed_clients"
              size="small"
              multiple
              value={stateEntity.allowed_clients}
              placeholder={T.translate("emails.placeholders.select_client")}
              options={email_clients_ddl}
              onChange={handleClientsChange}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <label> {T.translate("emails.parent")} *</label>
            <EmailTemplateInput
              id="parent"
              value={stateEntity.parent}
              ownerId={stateEntity.id}
              placeholder={T.translate("emails.placeholders.select_parent")}
              onChange={handleChange}
            />
          </Grid2>
        </Grid2>
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <label> {T.translate("emails.from_email")} *</label>
            <TextField
              id="from_email"
              fullWidth
              size="small"
              value={stateEntity.from_email}
              onChange={handleChange}
              error={!!hasErrors("from_email", errors)}
              helperText={hasErrors("from_email", errors) || undefined}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <label> {T.translate("emails.subject")} *</label>
            <TextField
              id="subject"
              fullWidth
              size="small"
              value={stateEntity.subject}
              onChange={handleChange}
              error={!!hasErrors("subject", errors)}
              helperText={hasErrors("subject", errors) || undefined}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <label> {T.translate("emails.max_retries")} *</label>
            <TextField
              id="max_retries"
              type="number"
              fullWidth
              size="small"
              value={stateEntity.max_retries}
              onChange={handleChange}
              error={!!hasErrors("max_retries", errors)}
              helperText={hasErrors("max_retries", errors) || undefined}
            />
          </Grid2>
        </Grid2>
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" onClick={handleJsonDataEdit}>
              {T.translate("emails.edit_json")}
            </Button>
          </Grid2>
        </Grid2>
        <Grid2 container spacing={2}>
          <Grid2 size={12}>
            {templateLoaded ? (
              <div className="email-template-container">
                <div
                  className="email-template-buttons"
                  style={{ width: singleTab && mjmlEditor ? "" : "" }}
                >
                  {!previewOnly && (
                    <div>
                      <div>
                        {mjmlEditor ? (
                          <>
                            <label>
                              {T.translate("emails.mjml_content")}
                              {" using "}
                              <a
                                target="_blank"
                                href="https://documentation.mjml.io/"
                                rel="noreferrer"
                              >
                                MJML format
                              </a>
                            </label>
                            <br />
                            <Button
                              variant="contained"
                              onClick={() => {
                                setMjmlEditor(false);
                              }}
                            >
                              {T.translate("emails.display_html")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <label>
                              {T.translate("emails.html_content")}
                              {" in "}
                              <a
                                target="_blank"
                                href="https://opensource.com/sites/default/files/gated-content/osdc_cheatsheet-jinja2.pdf"
                                rel="noreferrer"
                              >
                                jinja format
                              </a>
                              {" *"}
                            </label>
                            <br />
                            <Button
                              variant="contained"
                              onClick={() => {
                                setMjmlEditor(true);
                              }}
                            >
                              {T.translate("emails.display_mjml")}
                            </Button>
                          </>
                        )}
                      </div>
                      {entity.id > 0 && stateEntity.versions.length > 0 && (
                        <Grid2 container spacing={1} sx={{ width: "66.66%" }}>
                          <Grid2 size={11}>
                            <label>
                              {T.translate("emails.previous_template")}
                            </label>
                            <br />
                            <MuiDropdown
                              id="history_version"
                              size="small"
                              value={historyVersion}
                              placeholder={T.translate(
                                "emails.placeholders.select_version"
                              )}
                              options={versions_ddl}
                              onChange={handleVersionChange}
                            />
                          </Grid2>
                          {currentVersionExternalLink && (
                            <Grid2 size={1}>
                              <a
                                href={currentVersionExternalLink}
                                title={T.translate(
                                  "emails.placeholders.see_version"
                                )}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <i className="fa fa-github fa-lg" />
                              </a>
                            </Grid2>
                          )}
                        </Grid2>
                      )}
                    </div>
                  )}
                  {!codeOnly && (
                    <div>
                      <label>{T.translate("emails.preview_title")}</label>
                      <br />
                      <Button
                        variant="contained"
                        onClick={() => setMobileView(!mobileView)}
                      >
                        {mobileView
                          ? T.translate("emails.display_desktop")
                          : T.translate("emails.display_mobile")}
                      </Button>
                    </div>
                  )}
                </div>
                <br />
                <div className="email-template-content">
                  {!previewOnly && (
                    <div className="email-template-code">
                      {mjmlEditor ? (
                        <CodeMirror
                          id="mjml_content"
                          value={stateEntity.mjml_content}
                          onChange={(value, viewUpdate) =>
                            handleCodeMirrorMJMLChange(value, viewUpdate)
                          }
                          height="960px"
                          theme={sublimeInit({
                            settings: {
                              caret: "#c6c6c6",
                              fontFamily: "monospace"
                            }
                          })}
                          extensions={[
                            html({
                              autoCloseTags: true,
                              matchClosingTags: true,
                              selfClosingTags: true
                            })
                          ]}
                        />
                      ) : (
                        <CodeMirror
                          id="html_content"
                          value={stateEntity.html_content}
                          onChange={(value, viewUpdate) =>
                            handleCodeMirrorHTMLChange(value, viewUpdate)
                          }
                          height="960px"
                          theme={sublimeInit({
                            settings: {
                              caret: "#c6c6c6",
                              fontFamily: "monospace"
                            }
                          })}
                          extensions={[
                            html({
                              autoCloseTags: true,
                              matchClosingTags: true,
                              selfClosingTags: true
                            })
                          ]}
                        />
                      )}
                    </div>
                  )}
                  <div
                    className={`email-template-content-buttons ${
                      previewOnly || codeOnly ? "single-button" : ""
                    }`}
                  >
                    {!codeOnly && (
                      <button
                        type="button"
                        id="code"
                        onClick={(ev) => handleTabChange(ev)}
                      >
                        <i className="fa fa-chevron-right" />
                      </button>
                    )}
                    {!previewOnly && (
                      <button
                        type="button"
                        id="preview"
                        onClick={(ev) => handleTabChange(ev)}
                      >
                        <i className="fa fa-chevron-left" />
                      </button>
                    )}
                  </div>
                  {!codeOnly && (
                    <div className="email-template-preview" ref={previewRef}>
                      {templateLoading && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 1
                          }}
                        >
                          <CircularProgress size={120} />
                        </Box>
                      )}
                      {renderErrors.length > 0 ? (
                        <Box>
                          There is an error trying to render the email template:
                          <ul>
                            {renderErrors.map((err) => (
                              <li>{err}</li>
                            ))}
                          </ul>
                        </Box>
                      ) : mjmlRenderError?.message ? (
                        <Box>
                          There is an error trying to render the email template:
                          <ul>{mjmlRenderError.message}</ul>
                        </Box>
                      ) : (
                        previewLoaded && (
                          <iframe
                            style={{ ...style }}
                            id="preview"
                            name="preview"
                            title="Email template preview"
                            sandbox="allow-same-origin"
                            srcDoc={preview}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>Loading template...</div>
            )}
          </Grid2>
        </Grid2>
      </form>
    );
  }
);

export default EmailTemplateForm;
