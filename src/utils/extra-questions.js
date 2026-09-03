export const QuestionType_Text = "Text";
export const QuestionType_TextArea = "TextArea";
export const QuestionType_Checkbox = "CheckBox";
export const QuestionType_RadioButtonList = "RadioButtonList";
export const QuestionType_ComboBox = "ComboBox";
export const QuestionType_CheckBoxList = "CheckBoxList";
export const QuestionType_CountryComboBox = "CountryComboBox";
export const QuestionType_RadioButton = "RadioButton";

// function from my-orders-widget
export const toSlug = (text, questionId) => {
  const textLC = text.toLowerCase();
  return `${textLC.replace(/[^a-zA-Z0-9]+/g, "_")}_${questionId}`;
};

export const getTypeValue = (ans, type) => {
  switch (type) {
    case QuestionType_Checkbox:
      return ans === "true";
    case QuestionType_CheckBoxList:
      return ans ? ans.split(",") : [];
    case QuestionType_CountryComboBox:
    case QuestionType_ComboBox:
      return ans || "";
    case QuestionType_RadioButtonList:
      return ans || null;
    default:
      return ans;
  }
};

// reverse of getTypeValue: formats a typed form value back into the string
// the API expects for extra_questions[].answer
export const formatAnswerForSubmit = (value, type) => {
  if (Array.isArray(value)) return value.filter((v) => v !== "").join(",");
  if (type === QuestionType_Checkbox) return value ? "true" : "false";
  return value === null || value === undefined ? "" : `${value}`;
};
