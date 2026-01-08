import * as yup from "yup";
import T from "i18n-react";

export const addEmailListValidator = () => {
  yup.addMethod(yup.string, "emailList", function (errorMessage) {
    return this.test("emailList", errorMessage, function (value) {
      const { path, createError } = this;
      if (!value) {
        return true; // Or handle empty values as needed
      }
      const emails = value.replace(/\s/g, "").split(";");
      const isValid = emails.every((email) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      );
      return isValid || createError({ path, message: errorMessage });
    });
  });
};

export const addIssAfterDateFieldValidator = () => {
  yup.addMethod(yup.date, "isAfterDateField", function (fieldRef, message) {
    return this.test("is-after-date-field", message, (value, ctx) => {
      const { path, createError, resolve } = ctx;
      const referencedFieldValue = resolve(fieldRef);

      // If either value is missing, validation passes
      if (!referencedFieldValue || !value) return true;

      // Check if current date is after the referenced field date
      if (referencedFieldValue >= value) {
        return createError({
          path,
          message
        });
      }
      return true;
    });
  });
};

export const numberValidation = () =>
  yup.number().typeError(T.translate("validation.number"));

export const decimalValidation = () =>
  yup
    .number()
    .typeError(T.translate("validation.number"))
    .positive(T.translate("validation.number_positive"))
    .required(T.translate("validation.required"))
    .test("max-decimals", T.translate("validation.two_decimals"), (value) => {
      if (value === undefined || value === null) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    });
