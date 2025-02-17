import React, { useRef, useMemo } from "react";
import JoditEditor from "jodit-react";

const TextEditorV3 = ({
  id,
  value,
  error,
  className,
  onChange,
  options = {}
}) => {
  const editor = useRef(null);

  // all options from https://xdsoft.net/jodit/docs/,
  const config = useMemo(
    () => ({
      license: process.env.JODIT_LICENSE_KEY,
      placeholder: "Start typings...",
      className,
      buttons: [
        "bold",
        "italic",
        "strikethrough",
        "underline",
        "|",
        "source",
        "|",
        "font",
        "fontsize",
        "align",
        "|",
        "ul",
        "ol",
        "image",
        "link",
        "|",
        "undo",
        "redo"
      ],
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      pasteFromWord: {
        enable: true,
        convertUnitsToPixel: true
      },
      beautifyHTML: false,
      ...options
    }),
    [options, className]
  );

  const handleChange = (newValue) => {
    const ev = {
      target: {
        id,
        value: newValue,
        type: "texteditor"
      }
    };

    onChange(ev);
  };

  return (
    <div className="editor-input">
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={handleChange} // preferred to use only this option to update the content for performance reasons
      />
      {error && <p className="error-label">{error}</p>}
    </div>
  );
};

export default TextEditorV3;
