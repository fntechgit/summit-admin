import * as yup from "yup";

export const addEmailListValidator = () => {
  yup.addMethod(yup.string, "emailList", function (errorMessage) {
    return this.test("emailList", errorMessage, function (value) {
      const { path, createError } = this;
      if (!value) {
        return true; // Or handle empty values as needed
      }
      const emails = value.replace(/\s/g, "").split(",");
      const isValid = emails.every((email) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      );
      return isValid || createError({ path, message: errorMessage });
    });
  });
};
