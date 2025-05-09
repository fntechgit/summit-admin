import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import SortableCard from "../SortableCard";
import { moveItem } from "../../../utils/methods";
import styles from "./index.module.less";
import ListPlaceholder from "../Placeholder";

// const altThreshold = track.session_count;
// limit = track.limit

const List = ({
  list,
  altThreshold,
  limit,
  onReorder,
  onDrop,
  onColumnChange,
  onCardClick
}) => {
  const handleDrag = (item, toItem, toList) => {
    const toItemIds = toList.items.map((it) => it.id);
    const alreadyExists = toItemIds.includes(item.id);
    const canAddItem =
      !alreadyExists && toList.dragIn && toItemIds.length < limit;

    // cannot move out from list
    if (!item.originalList.dragOut && toList.id !== item.originalList.id)
      return;

    // can ONLY move out, not sort
    if (!item.originalList.sortable && toList.id === item.originalList.id)
      return;

    // if item is changing column but new column cannot accept it
    if (item.originalList.id !== toList.id && !canAddItem) return;

    if (item.originalList.id !== toList.id) {
      // if item original list is different from destination list, then is a column change
      onColumnChange(item, toItem, toList.id);
    } else if (item.order !== toItem.order) {
      // if the order is changing then reorder the destination list
      const newItems = moveItem(list.items, item.order - 1, toItem.order - 1);
      onReorder(list.id, newItems);
    }
  };

  const handleRemove = (id) => {
    const newItems = list.items.filter((it) => it.id !== id);
    onReorder(list.id, newItems);
    onDrop();
  };

  const handleDropOnEmptyList = (listId, newItems) => {
    onReorder(listId, newItems);
    onDrop();
  };

  if (!list) return <div>Not found</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.wrapper}>
        {list.items.map((it, i) => (
          <SortableCard
            key={`sortable-card-${it?.id}`}
            item={it}
            list={list}
            isAlternate={i >= altThreshold}
            onCardClick={onCardClick}
            onMove={handleDrag}
            onRemove={handleRemove}
            onDrop={onDrop}
          />
        ))}
      </div>
      {list.items.length === 0 && (
        <ListPlaceholder list={list} onDrop={handleDropOnEmptyList} />
      )}
    </DndProvider>
  );
};

export default List;
