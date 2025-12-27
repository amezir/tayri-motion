import React from "react";
import clsx from "clsx";
import styles from "./ControlPanel.module.scss";
import useParamsDefaults from "@/hooks/useParamsDefaults";

const ResetButton = ({ keys, paramsRef, updateParam, isAltTheme }) => {
  const { getDefaults, isModified } = useParamsDefaults(paramsRef);

  const reset = (values = {}) => {
    Object.entries(values).forEach(([k, v]) => updateParam(k, v));
  };

  if (!isModified(keys)) return null;

  return (
    <button
      type="button"
      onClick={() => reset(getDefaults(keys))}
      className={clsx(styles.resetButton, isAltTheme && styles.resetButtonAlt)}
    >
      Reset to Default
    </button>
  );
};

export default ResetButton;
