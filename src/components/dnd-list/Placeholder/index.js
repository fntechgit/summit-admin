import React from "react";
import PropTypes from "prop-types";
import { useDrop } from "react-dnd";
import styles from "./index.module.less";


const ListPlaceholder = ({list, lastIdx, onMove, onDrop}) => {
    const {id: listID, hash: listHash, type} = list;

    const [collectedProps, drop] = useDrop(() => ({
        accept: "card",
        hover(draggedItem, monitor) {
            const hostItem = {index: lastIdx, type, list};

            // prevent moving from a list that cannot drag out
            if (!draggedItem.originalList.dragOut && draggedItem.originalList.id !== listID) return;

            onMove(draggedItem, hostItem);
            // item.index = lastIdx;
            // item.type = hoverList;
            // item.targetListID = listID;
            // item.targetListHash = listHash;

        },
        canDrop(item, monitor) {
            return list.dragIn && list.id !== item.originalList.id;
        },
        drop(item, monitor) {
            if (monitor.canDrop()) {
                onDrop()
            }
        },
    }), [lastIdx]);

    return (
      <div ref={drop} className={styles.wrapper}>DROP ITEM</div>
    );
}

ListPlaceholder.propTypes = {
    onMove: PropTypes.func.isRequired
};

export default ListPlaceholder;