import React from "react";
import TextEditorV3 from "openstack-uicore-foundation/lib/components/inputs/editor-input-v3";
import { useFormikContext } from "formik";
import normalizeHtmlString from "../../utils/normalize-html-string";

const FormikTextEditor = ({ name, ...props }) => {
  const { values, errors, touched, setFieldValue, setFieldTouched } =
    useFormikContext();

  return (
    <TextEditorV3
      name={name}
      id={name}
      value={values[name]}
      onChange={(e) => {
        const stringValue = normalizeHtmlString(e.target.value);
        setFieldValue(name, stringValue);
      }}
      onBlur={() => setFieldTouched(name, true)}
      error={touched?.[name] && errors?.[name] ? errors?.[name] : ""}
      license={process.env.JODIT_LICENSE_KEY}
      {...props}
    />
  );
};

export default FormikTextEditor;
