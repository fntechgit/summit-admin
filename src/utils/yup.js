import * as yup from "yup";

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
