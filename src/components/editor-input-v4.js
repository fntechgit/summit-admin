import React, { useRef } from "react";
import StarterKit from "@tiptap/starter-kit";
import {
  MenuButtonBold,
  MenuButtonCode,
  MenuButtonItalic,
  MenuButtonStrikethrough,
  MenuControlsContainer,
  MenuDivider,
  RichTextEditor
} from "mui-tiptap";

const TextEditorV4 = ({ id, value, error, onChange }) => {
  const rteRef = useRef(null);

  const handleChange = ({ editor }) => {
    const newValue = editor?.getHTML();
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
      <RichTextEditor
        ref={rteRef}
        extensions={[StarterKit]} // Or any Tiptap extensions you wish!
        content={value} // Initial content for the editor
        renderControls={() => (
          <MenuControlsContainer>
            <MenuButtonBold />
            <MenuButtonItalic />
            <MenuButtonStrikethrough />
            <MenuDivider />
            <MenuButtonCode />
            <MenuDivider />
          </MenuControlsContainer>
        )}
        onBlur={handleChange}
      />
      {error && <p className="error-label">{error}</p>}
    </div>
  );
};

export default TextEditorV4;
