import React, { useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, Link } from "@mui/material";

const DEFAULT_LINES = 2;

const linkSx = {
  color: "text.secondary",
  fontSize: "body2.fontSize",
  verticalAlign: "baseline",
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" }
};

const ExpandText = ({ children, lines = DEFAULT_LINES, charCount }) => {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef(null);
  const text = children ?? "";
  const capByChars = typeof charCount === "number";

  // the line clamp is pure CSS, so measure whether it actually hid anything (and re-check on resize)
  useLayoutEffect(() => {
    if (capByChars || expanded || !textRef.current) return undefined;
    const el = textRef.current;
    const measure = () => setIsClamped(el.scrollHeight > el.clientHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, lines, capByChars, expanded]);

  const handleToggle = (ev) => {
    // keep the click from reaching a clickable parent (e.g. table row)
    ev.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const renderToggle = (sx = {}) => (
    <Link
      component="button"
      type="button"
      onClick={handleToggle}
      sx={{ ...linkSx, ...sx }}
    >
      {T.translate(expanded ? "general.read_less" : "general.read_more")}
    </Link>
  );

  const renderReadLess = () => (
    <>
      <Box component="span" sx={{ color: "text.secondary" }}>
        {" · "}
      </Box>
      {renderToggle()}
    </>
  );

  if (capByChars) {
    if (text.length <= charCount) return text;
    return (
      <Box component="span" sx={{ overflowWrap: "anywhere" }}>
        {expanded ? text : `${text.slice(0, charCount)}... `}
        {expanded ? renderReadLess() : renderToggle()}
      </Box>
    );
  }

  if (expanded) {
    return (
      <Box sx={{ overflowWrap: "anywhere" }}>
        {text}
        {renderReadLess()}
      </Box>
    );
  }

  // flex parent gives the clamped box a definite height so the ::before spacer can use 100%
  return (
    <Box sx={{ display: "flex", overflowWrap: "anywhere" }}>
      <Box
        ref={textRef}
        sx={{
          display: "-webkit-box",
          WebkitLineClamp: lines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          // spacer float pushes the toggle down to the last visible line, so the ellipsis lands before it
          "&::before": {
            content: "\"\"",
            float: "right",
            height: "calc(100% - 1lh)"
          }
        }}
      >
        {isClamped && renderToggle({ float: "right", clear: "both", ml: 0.5 })}
        {text}
      </Box>
    </Box>
  );
};

ExpandText.propTypes = {
  children: PropTypes.string,
  // number of visible lines before capping; ignored when charCount is set
  lines: PropTypes.number,
  // caps by characters instead of lines
  charCount: PropTypes.number
};

export default ExpandText;
