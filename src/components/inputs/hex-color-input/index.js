import React, { useState } from 'react'
import styles from './index.module.less';
import { ChromePicker } from 'react-color';

const HexColorInput = ({ onChange, id, className, value }) => {

    const [displayColorPicker, setDisplayColorPicker] = useState(false);
    const [hexColor, setHexColor] = useState(value);

    const handlePopupClose = () => {

        const newEvent = {
            target: {
                value: hexColor,
                id: id,
                type: 'hexcolorinput'
            }
        }

        onChange(newEvent);
        setDisplayColorPicker(false);
    }

    return (
        <div className={`${styles.colorWrapper} ${className}`} onClick={() => !displayColorPicker && setDisplayColorPicker(true)}>
            {value}
            {value && <div className={styles.colorSquare} style={{ backgroundColor: value }} />}
            {displayColorPicker ?
                <div className={styles.popover}>
                    <div className={styles.cover} onClick={() => handlePopupClose()} />
                    <ChromePicker
                        key={`color-picker-${value}`}
                        disableAlpha={true}
                        onChange={(color) => {
                            setHexColor(color.hex);
                        }}
                        id={id}
                        color={hexColor}
                    />
                </div>
                :
                null
            }
        </div>
    );
}

export default HexColorInput;