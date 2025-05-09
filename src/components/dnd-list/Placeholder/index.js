import React from "react";
import PropTypes from "prop-types";
import { useDrop } from "react-dnd";
import styles from "./index.module.less";

const ListPlaceholder = ({ list, onDrop }) => {
  const [, drop] = useDrop(() => ({
    accept: "card",
    canDrop() {
      // can always drop, is a placeholder
      return true;
    },
    drop(item, monitor) {
      if (monitor.canDrop()) {
        onDrop(list.id, [item]);
      }
    }
  }));

  return (
    <div ref={drop} className={styles.wrapper}>
      DROP ITEM
    </div>
  );
};

ListPlaceholder.propTypes = {
  onDrop: PropTypes.func.isRequired
};

export default ListPlaceholder;
