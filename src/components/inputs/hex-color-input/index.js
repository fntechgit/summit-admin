import React, { useState } from "react";
import Sketch from "@uiw/react-color-sketch";
import styles from "./index.module.less";

const HexColorInput = ({ onChange, id, className, value }) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [hexColor, setHexColor] = useState(value);

  console.log("CLOR VALUE", value);

  const handlePopupClose = () => {
    const newEvent = {
      target: {
        value: hexColor,
        id,
        type: "hexcolorinput"
      }
    };

    onChange(newEvent);
    setDisplayColorPicker(false);
  };

  const handleRemoveColor = (ev) => {
    ev.stopPropagation();
    const newEvent = {
      target: {
        value: "",
        id,
        type: "hexcolorinput"
      }
    };

    onChange(newEvent);
    setHexColor("");
    setDisplayColorPicker(false);
  };

  return (
    <div
      className={`${styles.colorWrapper} ${className}`}
      onClick={() => !displayColorPicker && setDisplayColorPicker(true)}
    >
      {value}
      {value && (
        <div className={styles.selectedColorContainer}>
          <button
            className={styles.removeColor}
            onClick={(ev) => handleRemoveColor(ev)}
          >
            <i className="fa fa-close" />
          </button>
          <div
            className={styles.colorSquare}
            style={{ backgroundColor: value }}
          />
        </div>
      )}
      {displayColorPicker ? (
        <div className={styles.popover}>
          <div className={styles.cover} onClick={() => handlePopupClose()} />
          <Sketch
            key={`color-picker-${value}`}
            style={{ padding: 5 }}
            disableAlpha
            presetColors={false}
            onChange={(color) => {
              setHexColor(color.hex);
            }}
            id={id}
            color={hexColor}
          />
        </div>
      ) : null}
    </div>
  );
};

export default HexColorInput;
