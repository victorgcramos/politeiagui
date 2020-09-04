import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { NumberInput, classNames } from "pi-ui";
import styles from "./DigitsInput.module.css";

const DigitsInput = ({ length, onChange }) => {
  const [digits, setDigits] = useState(Array(length).fill(""));
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const handleChangeDigit = (e) => {
    e && e.preventDefault();
    let newDigits = e.target.value.toString().split("").splice(0, length);
    if (newDigits.length < length) {
      const fillArray = Array(length - newDigits.length).fill("");
      newDigits = [...newDigits, ...fillArray];
    }
    setDigits(newDigits);
    onChange(newDigits.join(""));
  };

  return (
    <>
      <input
        type="number"
        className={styles.mainInput}
        autoFocus
        onChange={handleChangeDigit}
        value={digits.join("")}
        ref={inputRef}
        onBlur={() => {
          setFocused(false);
        }}
      />
      <div
        className={classNames(
          styles.digitsWrapper,
          focused && styles.focusedInput
        )}>
        {digits.map((value, index) => {
          return (
            <NumberInput
              id={`id-digit-${index}`}
              key={`digit-${index}`}
              defaultValue={value}
              onFocus={() => {
                inputRef.current.focus();
                setFocused(true);
              }}
            />
          );
        })}
      </div>
    </>
  );
};

DigitsInput.propTypes = {
  length: PropTypes.number,
  onChange: PropTypes.func,
  onFill: PropTypes.func
};

DigitsInput.defaultProps = {
  length: 6,
  onChange: () => {},
  onFill: () => {}
};

export default DigitsInput;