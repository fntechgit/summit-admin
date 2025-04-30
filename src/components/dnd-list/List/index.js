import React from "react";
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import SortableCard from "../SortableCard";
import Placeholder from "../Placeholder";
import { moveItem } from "../../../utils/methods";
import styles from "./index.module.less";

// const altThreshold = track.session_count;
// limit = track.limit

const List = ({list, dragIn = false, dragOut = false, sortable = false, altThreshold, limit, onReorder, onDrop, onColumnChange, onCardClick}) => {
    const {id, hash, selections, type} = list || {};
    const sortedSelections = selections?.sort((a,b) => a.order - b.order);
    const selectionsCount = sortedSelections?.length || 0;

    const handleDrag = (item, toItem) => {
        console.log("handleDrag", item, toItem);
        const { index: toIndex, list: {id: toListId}} = toItem;
        const selectionIds = selections.map(s => s.id)
        const alreadyExists = selectionIds.includes(item.id);
        const canAddItem = !alreadyExists && dragIn && selections.length < limit;

        // cannot move out from list
        if (!item.originalList.dragOut && toListId !== item.originalList.id) return;

        // can ONLY move out
        if (!item.originalList.sortable && toListId === item.originalList.id) return;

        // if item is changing column but new column cannot accept it
        if (item.originalList.id !== toListId && !canAddItem) return;

        if (item.originalList.id !== toListId) {
            // if item original list is different from destination list, then is a column change
            onColumnChange(item, toItem);
        } else if (item.index !== toIndex) {
            // if the index is changing then reorder the destination list
            console.log('before move: ',item.index, toIndex)
            const newSelections = moveItem(selections, item.index, toIndex);
            onReorder(list.id, newSelections);
        }

    };

    const handleRemove = (id) => {
        const newSelections = selections.filter(s => s.presentation.id !== id);
        onReorder(list.id, newSelections);
        onDrop();
    };

    if (!list) return <div>Not found</div>;

    return (
      <DndProvider backend={HTML5Backend}>
          <div className={styles.wrapper}>
              {sortedSelections.map((s,i) => (
                <SortableCard
                  id={s?.id}
                  key={`sortable-card-${s?.id}`}
                  index={i}
                  isAlternate={i >= altThreshold}
                  list={{id, hash, dragOut, dragIn, sortable, type}}
                  presentation={s}
                  onCardClick={onCardClick}
                  onMove={handleDrag}
                  onRemove={handleRemove}
                  onDrop={onDrop}
                />
              ))}
          </div>
      </DndProvider>
    );
}

export default List;