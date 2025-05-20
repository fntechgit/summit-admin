import React from "react";
import styles from "./index.module.less";

const iconClasses = {
  selectors_count: "fa-thumbs-up",
  likers_count: "fa-eye",
  passers_count: "fa-thumbs-down",
  track_chair_avg_score: "fa-star",
  comments_count: "fa-comment"
};

const MetaSection = ({ meta }) => {
  const innerContent = Object.entries(iconClasses).map(([key, iconClass]) => {
    if (meta?.[key]) {
      if (meta[key] === 0 && key !== "comments_count") return null;

      return (
        <span key={`stat-${key}`} className={styles[key]}>
          <i className={`fa ${iconClass}`} /> {meta[key]}
        </span>
      );
    }
    return null;
  });

  return <span className={styles.wrapper}>{innerContent}</span>;
};

export default MetaSection;
