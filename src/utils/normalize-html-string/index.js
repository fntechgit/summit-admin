// removes html tags if contained text is empty
const normalizeHtmlString = (textInput) => {
  if (!textInput) return "";
  const doc = new DOMParser().parseFromString(textInput, "text/html");
  return doc.body.textContent.trim().length === 0 ? "" : textInput;
};

export default normalizeHtmlString;
