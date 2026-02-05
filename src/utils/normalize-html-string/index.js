// removes html tags if contained text is empty
const normalizeHtmlString = (textInput) => {
  const doc = new DOMParser().parseFromString(textInput, "text/html");
  return doc.body.textContent.length === 0 ? "" : textInput;
};

export default normalizeHtmlString;
