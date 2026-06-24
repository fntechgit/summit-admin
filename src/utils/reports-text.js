// Sponsor-portal text fields (content.value / content.summary) may carry HTML
// markup (e.g. "<p>...</p>"). The reports render them as plain text, so strip
// tags and decode the common entities rather than show raw markup. We do NOT
// render the HTML (would be an XSS surface); we flatten it to readable text.
const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " "
};

export const toPlainText = (html) => {
  if (html == null) return "";
  return String(html)
    .replace(/<[^>]*>/g, " ") // tags become whitespace so boundaries don't fuse words
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => (m in ENTITIES ? ENTITIES[m] : m))
    .replace(/\s+/g, " ")
    .trim();
};

export default toPlainText;
