import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef
} from "react";
import styles from "./index.module.less";

const ButtonPanelAlignment = {
  RIGHT: "Right",
  BOTTOM: "Bottom"
};

const FormRepeater = forwardRef(
  (
    {
      initialLines = [],
      renderContent,
      onLineRemoveRequest,
      buttonsPanelAlignment = ButtonPanelAlignment.RIGHT
    },
    ref
  ) => {
    const [lines, setLines] = useState([{ id: Date.now(), value: "" }]);

    useEffect(() => {
      if (initialLines.length > 0) {
        setLines(
          initialLines.map((line) => ({ id: line.id || Date.now(), ...line }))
        );
      } else {
        setLines([{ id: 1, value: "" }]);
      }
    }, [initialLines]);

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

    const handleRemoveLine = async (line) => {
      if (onLineRemoveRequest && (await onLineRemoveRequest(line))) {
        setLines(lines.filter((l) => l.id !== line.id));
      }
    };

    useImperativeHandle(ref, () => ({
      getContent: () => lines
    }));

    return (
      <div>
        {lines.map((line) => (
          <div
            key={line.id}
            className={styles[`container${buttonsPanelAlignment}`]}
          >
            <div className={styles.contentBody}>
              {renderContent(line, (value, callback) => {
                const updatedLines = lines.map((l) =>
                  l.id === line.id ? { ...l, value } : l
                );
                if (callback) {
                  callback(updatedLines);
                }
                setLines(updatedLines);
              })}
            </div>
            <div className={styles[`buttonsPanel${buttonsPanelAlignment}`]}>
              {(lines.length > 1 || (lines.length === 1 && lines[0].value)) && (
                <button
                  type="button"
                  onClick={() => handleRemoveLine(line)}
                  className={styles[`deleteButton${buttonsPanelAlignment}`]}
                >
                  <i
                    className="fa fa-trash"
                    aria-hidden="true"
                    title="Remove"
                  />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleAddLine(line.id)}
                className={styles[`addButton${buttonsPanelAlignment}`]}
              >
                <i className="fa fa-plus" aria-hidden="true" title="Add" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

export default FormRepeater;
export { ButtonPanelAlignment };
