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

import React, { useState, useEffect, useMemo, useRef } from "react";
import T from "i18n-react/dist/i18n-react";
import debounce from "lodash/debounce";
import { useFormik, FormikProvider } from "formik";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import InputLabel from "@mui/material/InputLabel";
import CircularProgress from "@mui/material/CircularProgress";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import CodeMirror from "@uiw/react-codemirror";
import { sublimeInit } from "@uiw/codemirror-theme-sublime";
import { html } from "@codemirror/lang-html";
import mjml2html from "mjml-browser";
import showConfirmDialog from "../mui/showConfirmDialog";
import EmailTemplateInput from "../inputs/email-template-input";
import useScrollToError from "../../hooks/useScrollToError";
import {
  DEBOUNCE_WAIT,
  EMAIL_TEMPLATE_TYPE_HTML,
  EMAIL_TEMPLATE_TYPE_MJML
} from "../../utils/constants";

const TemplateModeToggle = ({ mjmlEditor, onDisplayMjml, onDisplayHtml }) =>
  mjmlEditor ? (
    <>
      <InputLabel htmlFor="mjml_content">
        {`${T.translate("emails.mjml_content")} ${T.translate(
          "emails.using"
        )} `}
        <a
          target="_blank"
          href="https://documentation.mjml.io/"
          rel="noreferrer"
        >
          {T.translate("emails.mjml_format")}
        </a>
      </InputLabel>
      <br />
      <Button variant="contained" onClick={onDisplayHtml}>
        {T.translate("emails.display_html")}
      </Button>
    </>
  ) : (
    <>
      <InputLabel htmlFor="html_content">
        {`${T.translate("emails.html_content")} ${T.translate("emails.in")} `}
        <a
          target="_blank"
          href="https://opensource.com/sites/default/files/gated-content/osdc_cheatsheet-jinja2.pdf"
          rel="noreferrer"
        >
          {T.translate("emails.jinja_format")}
        </a>
        {" *"}
      </InputLabel>
      <br />
      <Button variant="contained" onClick={onDisplayMjml}>
        {T.translate("emails.display_mjml")}
      </Button>
    </>
  );

const VersionHistoryPicker = ({
  historyVersion,
  versionsDdl,
  currentVersionExternalLink,
  onChange
}) => (
  <Grid2 container spacing={1} sx={{ width: "66.66%" }}>
    <Grid2 size={11}>
      <InputLabel htmlFor="history_version">
        {T.translate("emails.previous_template")}
      </InputLabel>
      <MuiDropdown
        id="history_version"
        size="small"
        value={historyVersion}
        placeholder={T.translate("emails.placeholders.select_version")}
        options={versionsDdl}
        onChange={onChange}
      />
    </Grid2>
    {currentVersionExternalLink && (
      <Grid2 size={1}>
        <a
          href={currentVersionExternalLink}
          title={T.translate("emails.placeholders.see_version")}
          target="_blank"
          rel="noreferrer"
        >
          <i className="fa fa-github fa-lg" />
        </a>
      </Grid2>
    )}
  </Grid2>
);

const CodeEditorPane = ({ width, id, value, onChange }) => (
  <Box sx={{ width, minWidth: "50%" }}>
    <CodeMirror
      id={id}
      value={value}
      onChange={onChange}
      height="960px"
      theme={sublimeInit({
        settings: { caret: "#c6c6c6", fontFamily: "monospace" }
      })}
      extensions={[
        html({
          autoCloseTags: true,
          matchClosingTags: true,
          selfClosingTags: true
        })
      ]}
    />
  </Box>
);

const toolbarSx = {
  display: "flex",
  flexDirection: "row",
  "& > div:first-of-type": {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    mr: "30px"
  },
  "& > div:last-of-type": { ml: "30px" },
  "@media only screen and (max-width: 992px)": {
    "& > div:first-of-type": {
      ml: 0,
      "& > div:last-of-type": { width: "100%" }
    }
  },
  "@media only screen and (max-width: 600px)": {
    "& > div:first-of-type": {
      flexDirection: "column",
      alignItems: "start",
      "& > div:last-of-type": { padding: 0 }
    }
  }
};

const paneToggleButtonSx = {
  width: "100%",
  padding: 0,
  backgroundColor: "#42474e",
  border: "none",
  borderRight: "1px solid #343436",
  color: "#fff",
  cursor: "pointer",
  flex: 1,
  fontSize: "12px",
  justifyContent: "center",
  transition: "background-color 0.3s ease-in-out",
  "&:hover": { backgroundColor: "#535a63" }
};

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

// HTML-only templates open in the HTML editor, everything else in MJML
const getInitialMjmlMode = (entity) =>
  entity.mjml_content.length > 0 ? true : !entity.html_content;

const EmailTemplateForm = ({
  entity,
  errors,
  clients,
  preview,
  templateLoading,
  renderErrors,
  onSubmit,
  onRender,
  templateJsonData,
  renderEmailTemplate
}) => {
  const [historyVersion, setHistoryVersion] = useState("");
  const [currentVersionExternalLink, setCurrentVersionExternalLink] =
    useState(null);
  const [mjmlEditor, setMjmlEditor] = useState(() =>
    getInitialMjmlMode(entity)
  );
  const [codeOnly, setCodeOnly] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [scale, setScale] = useState(1);
  const [singleTab, setSingleTab] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [mjmlWarning, setMjmlWarning] = useState(false);
  const [mjmlRenderError, setMjmlRenderError] = useState(null);

  const previewRef = useRef(null);

  // the server is the only validator (412 -> errors prop), so formik's own
  // validation passes are turned off -- they would only wipe server errors
  const formik = useFormik({
    initialValues:
      entity.id === 0
        ? { ...entity, mjml_content: default_mjml_content }
        : { ...entity },
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: (values) => Promise.resolve(onSubmit(values)).catch(() => {})
  });
  const { values } = formik;

  useScrollToError(formik);

  useEffect(() => {
    formik.setErrors(errors);
    formik.setTouched(
      Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
      false
    );
  }, [errors]);

  // a different template (or the id assigned right after a create) resets
  // the editor mode; enableReinitialize already reseeds the values
  useEffect(() => {
    setMjmlEditor(getInitialMjmlMode(entity));
  }, [entity.id]);

  const setFieldValue = (field, value) => {
    formik.setFieldValue(field, value, false);
    formik.setFieldError(field, undefined);
  };

  const handleFieldChange = (ev) => {
    formik.handleChange(ev);
    formik.setFieldError(ev.target.name, undefined);
  };

  useEffect(() => {
    if (singleTab) {
      if (!previewOnly) setCodeOnly(true);
    } else {
      setCodeOnly(false);
      setPreviewOnly(false);
    }
  }, [singleTab]);

  const debouncedRenderTemplate = useRef(
    debounce(async (content, json_data, isMjml) => {
      renderEmailTemplate(json_data, content, isMjml)
        .then(() => {
          // wait until first API email preview to display template on screen
          if (!previewLoaded) setPreviewLoaded(true);
        })
        .catch(() => {});
    }, DEBOUNCE_WAIT)
  ).current;

  // MJML mode sends raw mjml_content so the API runs Jinja -> official MJML CLI
  // (same pipeline as production); HTML mode sends html_content unchanged.
  // mjmlEditor is in the deps so a button-only mode switch re-fires this with
  // the other field's content.
  const editorContent = mjmlEditor ? values.mjml_content : values.html_content;

  useEffect(() => {
    debouncedRenderTemplate(editorContent, templateJsonData, mjmlEditor);
  }, [editorContent, mjmlEditor, entity, templateJsonData]);

  // only compile what the user changed (an edit or a picked history version):
  // the stored mjml was already validated by the API, and a child template's
  // raw mjml ({% extends 'layout' %} + blocks) is never a full <mjml>
  // document -- the API validates it after merging the parent, so the
  // browser compiler can't judge it. Skipping returns a null error so a
  // stale one doesn't keep Save disabled.
  // mjmlEditor is deliberately not a dep: a bare mode switch with unchanged
  // content must not compile
  const mjmlEdited =
    values.mjml_content !== formik.initialValues.mjml_content ||
    historyVersion !== "";
  const isChildTemplate = Boolean(values.parent?.id);

  const mjmlCompileResult = useMemo(() => {
    if (!mjmlEditor) return null;
    if (!mjmlEdited || isChildTemplate)
      return { htmlContent: null, error: null };
    try {
      const htmlContent = mjml2html(values.mjml_content, {
        validationLevel: "strict",
        keepComments: false,
        collapseWhitespace: true,
        minifyOptions: { collapseWhitespace: false }
      }).html;
      return { htmlContent, error: null };
    } catch (err) {
      return { htmlContent: null, error: err };
    }
  }, [values.mjml_content, historyVersion, mjmlEdited, isChildTemplate]);

  useEffect(() => {
    if (!mjmlCompileResult) return;
    setMjmlRenderError(mjmlCompileResult.error);
    if (mjmlCompileResult.htmlContent !== null) {
      formik.setFieldValue(
        "html_content",
        mjmlCompileResult.htmlContent,
        false
      );
    }
  }, [mjmlCompileResult]);

  // gate the confirm dialog BEFORE flipping mjmlEditor -- flipping it first and
  // asking after let the preview/compile effects fire on the still-empty
  // mjml_content while the dialog was still pending
  const handleDisplayMjml = () => {
    const needsMjmlWarning =
      entity.mjml_content.length === 0 &&
      entity.html_content.length > 0 &&
      !mjmlWarning;

    if (!needsMjmlWarning) {
      setMjmlEditor(true);
      return;
    }

    showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("emails.mjml_warning"),
      iconType: "warning",
      confirmButtonColor: "error",
      confirmButtonText: T.translate("emails.understand")
    }).then((confirmed) => {
      if (confirmed) {
        setMjmlWarning(true);
        setMjmlEditor(true);
      }
    });
  };

  const handleCodeMirrorChange = (value) => {
    setFieldValue(mjmlEditor ? "mjml_content" : "html_content", value);
  };

  const handleJsonDataEdit = (ev) => {
    ev.preventDefault();
    onRender();
  };

  const SINGLE_TAB_BREAKPOINT = 992;
  const MOBILE_PREVIEW_WIDTH = 320;
  const DESKTOP_PREVIEW_WIDTH = 800;

  const style = {
    width: `${mobileView ? MOBILE_PREVIEW_WIDTH : DESKTOP_PREVIEW_WIDTH}px`,
    height: "960px",
    transform: `scale(${scale})`
  };

  const handleResizeWindow = () => {
    setSingleTab(window.innerWidth < SINGLE_TAB_BREAKPOINT);
    const currentPreviewWidth = previewRef?.current?.offsetWidth;
    if (!currentPreviewWidth) return;
    const targetWidth = mobileView
      ? MOBILE_PREVIEW_WIDTH
      : DESKTOP_PREVIEW_WIDTH;
    // always recompute the full ratio -- shrink to fit when the container is
    // narrower than the target, but also grow back to 1 once there is room
    // again (a narrow measurement early in the mount sequence must not
    // permanently lock the preview at a reduced scale)
    setScale(Math.min(1, currentPreviewWidth / targetWidth));
  };

  const handleTabChange = (ev) => {
    const { id } = ev.currentTarget;
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
      formik.setValues(
        {
          ...values,
          html_content: values.original_html_content,
          mjml_content: values.original_mjml_content
        },
        false
      );
      setHistoryVersion("");
      setCurrentVersionExternalLink(null);
      return;
    }

    const selectedHistory = values.versions.find((h) => h.sha === value);
    setHistoryVersion(selectedHistory.sha);
    setCurrentVersionExternalLink(selectedHistory.html_url);
    if (selectedHistory.type === EMAIL_TEMPLATE_TYPE_HTML) {
      setMjmlEditor(false);
      setFieldValue("html_content", selectedHistory.content);
    }
    if (selectedHistory.type === EMAIL_TEMPLATE_TYPE_MJML) {
      setMjmlEditor(true);
      setFieldValue("mjml_content", selectedHistory.content);
    }
  };

  const isTemplateInvalid = mjmlEditor && mjmlRenderError !== null;

  // recompute whenever a layout-affecting toggle changes the preview
  // container's rendered width (not just on an actual window resize)
  useEffect(() => {
    handleResizeWindow();
  }, [mobileView, codeOnly, previewOnly, singleTab]);

  // bind the native listener once; the ref keeps it pointed at the latest
  // closure so a real resize still sees current state without rebinding
  const handleResizeWindowRef = useRef(handleResizeWindow);
  handleResizeWindowRef.current = handleResizeWindow;

  useEffect(() => {
    const onResize = () => handleResizeWindowRef.current();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const email_clients_ddl = clients
    ? clients.map((cli) => ({ label: cli.name, value: cli.id }))
    : [];
  const versions_ddl = values.versions
    ? [
        { value: "", label: T.translate("emails.current_version") },
        ...values.versions.map((v) => ({
          label: `${epochToMomentTimeZone(v.commit_date, "UTC").format(
            "YYYY-MM-DD HH:mm z"
          )} - ${v.sha} - ${v.commit_message}`,
          value: v.sha
        }))
      ]
    : [];

  const showCodeEditor = !previewOnly;
  const showPreview = !codeOnly;
  const codeWidth = codeOnly ? "100%" : "50%";
  const previewWidth = previewOnly ? "100%" : "50%";

  const renderPreviewBody = () => {
    if (renderErrors.length > 0) {
      return (
        <Box>
          {T.translate("emails.error_render_template")}
          <ul>
            {renderErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </Box>
      );
    }
    if (mjmlRenderError?.message) {
      return (
        <Box>
          {T.translate("emails.error_render_template")}
          <ul>
            <li>{mjmlRenderError.message}</li>
          </ul>
        </Box>
      );
    }
    return (
      previewLoaded && (
        <iframe
          style={{ ...style }}
          id="preview"
          name="preview"
          title={T.translate("emails.preview_title")}
          sandbox="allow-same-origin"
          srcDoc={preview}
        />
      )
    );
  };

  const textField = (name, label) => (
    <Grid2 size={{ xs: 12, md: 4 }}>
      <InputLabel htmlFor={name}>{`${T.translate(label)} *`}</InputLabel>
      <MuiFormikTextField
        id={name}
        name={name}
        size="small"
        margin="none"
        fullWidth
        onChange={handleFieldChange}
      />
    </Grid2>
  );

  return (
    <FormikProvider value={formik}>
      <Box
        component="form"
        className="email-template-form"
        onSubmit={formik.handleSubmit}
        noValidate
        autoComplete="off"
      >
        <input type="hidden" name="id" value={values.id} />
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          {textField("identifier", "emails.name")}
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="allowed_clients">
              {`${T.translate("emails.client")} *`}
            </InputLabel>
            <MuiDropdown
              id="allowed_clients"
              size="small"
              multiple
              value={values.allowed_clients}
              placeholder={T.translate("emails.placeholders.select_client")}
              options={email_clients_ddl}
              onChange={(ev) =>
                setFieldValue("allowed_clients", ev.target.value)
              }
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="parent">
              {`${T.translate("emails.parent")} *`}
            </InputLabel>
            <EmailTemplateInput
              id="parent"
              value={values.parent}
              ownerId={values.id}
              placeholder={T.translate("emails.placeholders.select_parent")}
              onChange={(ev) => setFieldValue("parent", ev.target.value)}
            />
          </Grid2>
        </Grid2>
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          {textField("from_email", "emails.from_email")}
          {textField("subject", "emails.subject")}
          <Grid2 size={{ xs: 12, md: 4 }}>
            <InputLabel htmlFor="max_retries">
              {`${T.translate("emails.max_retries")} *`}
            </InputLabel>
            <MuiFormikTextField
              id="max_retries"
              name="max_retries"
              type="number"
              size="small"
              margin="none"
              fullWidth
              onChange={handleFieldChange}
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
        <Box sx={{ height: "960px", mb: "50px" }}>
          <Box sx={toolbarSx}>
            {showCodeEditor && (
              <div style={{ width: codeWidth }}>
                <div>
                  <TemplateModeToggle
                    mjmlEditor={mjmlEditor}
                    onDisplayMjml={handleDisplayMjml}
                    onDisplayHtml={() => setMjmlEditor(false)}
                  />
                </div>
                {entity.id > 0 && values.versions.length > 0 && (
                  <VersionHistoryPicker
                    historyVersion={historyVersion}
                    versionsDdl={versions_ddl}
                    currentVersionExternalLink={currentVersionExternalLink}
                    onChange={handleVersionChange}
                  />
                )}
              </div>
            )}
            {showPreview && (
              <div style={{ width: previewWidth }}>
                <InputLabel>{T.translate("emails.preview_title")}</InputLabel>
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
          </Box>
          <br />
          <Box sx={{ display: "flex", flexDirection: "row", height: "100%" }}>
            {showCodeEditor && (
              <CodeEditorPane
                width={codeWidth}
                id={mjmlEditor ? "mjml_content" : "html_content"}
                value={editorContent}
                onChange={handleCodeMirrorChange}
              />
            )}
            <Box
              sx={{
                width: codeOnly || previewOnly ? "20px" : "30px",
                display: "flex",
                "& > button": paneToggleButtonSx
              }}
            >
              {showPreview && (
                <button
                  type="button"
                  id="code"
                  onClick={(ev) => handleTabChange(ev)}
                >
                  <i className="fa fa-chevron-right" />
                </button>
              )}
              {showCodeEditor && (
                <button
                  type="button"
                  id="preview"
                  onClick={(ev) => handleTabChange(ev)}
                >
                  <i className="fa fa-chevron-left" />
                </button>
              )}
            </Box>
            {showPreview && (
              <Box
                ref={previewRef}
                sx={{
                  width: previewWidth,
                  minWidth: "50%",
                  position: "relative",
                  "& > iframe": {
                    border: "none",
                    display: "block",
                    margin: "0 auto",
                    transformOrigin: "top left"
                  }
                }}
              >
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
                {renderPreviewBody()}
              </Box>
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting || isTemplateInvalid}
          >
            {T.translate("general.save")}
          </Button>
        </Box>
      </Box>
    </FormikProvider>
  );
};

export default EmailTemplateForm;
