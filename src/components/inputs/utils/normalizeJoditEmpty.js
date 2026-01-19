const normalizeJoditEmpty = (textInput) => {
  const doc = new DOMParser().parseFromString(textInput, "text/html");
  return doc.body.textContent.length === 0 ? "" : textInput;
};

export default normalizeJoditEmpty;
