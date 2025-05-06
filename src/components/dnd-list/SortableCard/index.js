import React, { useRef } from "react";
import PropTypes from "prop-types";
import { useDrag, useDrop } from "react-dnd";
import Card from "../Card";
import { TWO } from "../../../utils/constants";

const SortableCard = ({
  item,
  isAlternate,
  list,
  onMove,
  onDrop,
  onCardClick,
  onRemove
}) => {
  const ref = useRef(null);

  const [{ handlerId }, drop] = useDrop({
    accept: "card",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId()
      };
    },
    hover(draggedItem, monitor) {
      if (!ref.current) {
        return;
      }

      // prevent moving from a list that cannot drag out
      if (
        !draggedItem.originalList.dragOut &&
        draggedItem.originalList.id !== list.id
      )
        return;

      // Don't replace items with themselves
      if (draggedItem.id === item.id) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / TWO;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (
        draggedItem.order < item.order &&
        hoverClientY < hoverMiddleY &&
        draggedItem.originalList.id === list.id
      ) {
        return;
      }
      // Dragging upwards
      if (
        draggedItem.order > item.order &&
        hoverClientY > hoverMiddleY &&
        draggedItem.originalList.id === list.id
      ) {
        return;
      }
      // Time to actually perform the action
      onMove(draggedItem, item, list);
    },
    canDrop(draggedItem) {
      // if is sortable and item belongs to list, or allows drag in
      return (
        (list.sortable && list.id === draggedItem.originalList.id) ||
        (list.dragIn && list.id !== draggedItem.originalList.id)
      );
    },
    drop(draggedItem, monitor) {
      if (monitor.canDrop()) {
        onDrop();
      }
    }
  });
  const [{ isDragging }, drag] = useDrag({
    type: "card",
    item: () => ({ ...item, originalList: list }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });
  const opacity = isDragging ? 0 : 1;

  if (!item.id) return null;

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity, marginBottom: 10 }}
      data-handler-id={handlerId}
    >
      <Card
        id={item.id}
        title={item.title}
        level={item.level}
        order={item.order}
        sortable={list.sortable}
        isAlternate={isAlternate}
        onCardClick={onCardClick}
        onRemove={onRemove}
      />
    </div>
  );
};

SortableCard.propTypes = {
  item: PropTypes.object.isRequired,
  isAlternate: PropTypes.bool.isRequired,
  list: PropTypes.object.isRequired,
  onDrop: PropTypes.func,
  onCardClick: PropTypes.func,
  onRemove: PropTypes.func,
  onMove: PropTypes.func.isRequired
};

export default SortableCard;
