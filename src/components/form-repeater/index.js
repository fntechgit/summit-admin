import React, { useState } from "react";

const FormRepeater = ({ renderContent }) => {
  const [lines, setLines] = useState([{ id: Date.now(), value: "" }]);

  const handleAddLine = (id) => {
    const newLine = { id: Date.now(), value: "" };
    const index = lines.findIndex((line) => line.id === id);
    const updatedLines = [
      ...lines.slice(0, index + 1),
      newLine,
      ...lines.slice(index + 1)
    ];
    setLines(updatedLines);
  };

  const handleRemoveLine = (id) => {
    setLines(lines.filter((line) => line.id !== id));
  };

  return (
    <div>
      {lines.map((line) => (
        <div
          key={line.id}
          style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}
        >
          <div style={{ marginRight: "8px", flex: 1 }}>
            {renderContent(line, (value) => {
              const updatedLines = lines.map((l) =>
                l.id === line.id ? { ...l, value } : l
              );
              setLines(updatedLines);
            })}
          </div>
          <button
            type="button"
            onClick={() => handleAddLine(line.id)}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              marginRight: "4px"
            }}
          >
            <i className="fa fa-plus" aria-hidden="true" title="Add" />
          </button>
          {lines.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveLine(line.id)}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer"
              }}
            >
              <i className="fa fa-trash" aria-hidden="true" title="Remove" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormRepeater;
