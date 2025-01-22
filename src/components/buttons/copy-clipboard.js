import React from "react";
import T from "i18n-react/dist/i18n-react";
import { Tooltip } from "react-tooltip-5";
import { MILLISECONDS_IN_SECOND } from "../../utils/constants";

const CopyClipboard = ({ text, tooltipText }) => {
  const tooltipTextToUse =
    tooltipText || T.translate("general.copy_to_clipboard");
  const [tooltip, setTooltip] = React.useState(tooltipTextToUse);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setTooltip(T.translate("general.copied"));
    setTimeout(() => {
      setTooltip(tooltipTextToUse);
    }, MILLISECONDS_IN_SECOND);
  };

  return (
    <>
      &nbsp;
      <i
        data-tooltip-id="copy-tooltip"
        data-tooltip-content={tooltip}
        className="copy-button fa fa-clipboard"
        onClick={() => handleCopy()}
      />
      <Tooltip id="copy-tooltip" place="bottom" style={{ zIndex: 1000 }} />
    </>
  );
};

export default CopyClipboard;
