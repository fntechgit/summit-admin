import React from "react";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import { useField } from "formik";
import normalizeHtmlString from "../../utils/normalize-html-string";

const FormikTextEditor = ({ name, ...props }) => {
  const [field, meta, helpers] = useField(name);

  return (
    <TextEditorV3
      name={name}
      id={name}
      value={field.value}
      onChange={(e) => {
        const stringValue = normalizeHtmlString(e.target.value);
        helpers.setValue(name, stringValue);
      }}
      onBlur={() => helpers.setTouched(name, true)}
      error={meta.touched && meta.error ? meta.error : ""}
      license={process.env.JODIT_LICENSE_KEY}
      {...props}
    />
  );
};

export default FormikTextEditor;
