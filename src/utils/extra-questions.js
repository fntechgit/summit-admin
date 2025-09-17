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
      return ans?.split(",") || [];
    case QuestionType_CountryComboBox:
    case QuestionType_ComboBox:
      return ans || "";
    case QuestionType_RadioButtonList:
      return ans || null;
    default:
      return ans;
  }
};
