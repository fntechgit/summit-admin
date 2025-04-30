import React, { useRef } from "react";
import PropTypes from "prop-types";
import { useDrag, useDrop } from "react-dnd";
import Card from "../Card";

const SortableCard = ({id, index, isAlternate, list, presentation, onMove, onDrop, onCardClick, onRemove}) => {
    const {id: listID, hash: listHash, type} = list;
    const ref = useRef(null);

    const [{ handlerId }, drop] = useDrop({
        accept: "card",
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            };
        },
        hover(draggedItem, monitor) {
            if (!ref.current) {
                return;
            }
            const hostItem = {id, index, type, list};

            // prevent moving from a list that cannot drag out
            if (!draggedItem.originalList.dragOut && draggedItem.originalList.id !== listID) return;

            // Don't replace items with themselves
            if (draggedItem.id === hostItem.id) {
                return;
            }
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            // Get vertical middle
            // eslint-disable-next-line no-magic-numbers
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            // Determine mouse position
            const clientOffset = monitor.getClientOffset();
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (draggedItem.index < hostItem.index && hoverClientY < hoverMiddleY && draggedItem.originalList.id === hostItem.list.id) {
                return;
            }
            // Dragging upwards
            if (draggedItem.index > hostItem.index && hoverClientY > hoverMiddleY && draggedItem.originalList.id === hostItem.list.id) {
                return;
            }
            // Time to actually perform the action
            onMove(draggedItem, hostItem);
            // draggedItem.index = hostItem.index;
            // draggedItem.type = hoverList;
            // draggedItem.targetListID = listID;
            // draggedItem.targetListHash = listHash;
        },
        canDrop(item, monitor) {
            return list.dragIn && list.id !== item.originalList.id;
        },
        drop(item, monitor) {
            if (monitor.canDrop()) {
                onDrop()
            }
        },
    });
    const [{ isDragging }, drag] = useDrag({
        type: "card",
        item: () => ({ id, index, presentation, type, originalList: list }),
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });
    const opacity = isDragging ? 0 : 1;

    if (!presentation) return null;

    drag(drop(ref));

    return (
        <div ref={ref} style={{ opacity, marginBottom: 10 }} data-handler-id={handlerId}>
            <Card
              presentation={presentation}
              index={index}
              sortable={list.sortable}
              isAlternate={isAlternate}
              onCardClick={onCardClick}
              onRemove={onRemove}
            />
        </div>
    );
}

SortableCard.propTypes = {
    id: PropTypes.any.isRequired,
    index: PropTypes.number.isRequired,
    isAlternate: PropTypes.bool.isRequired,
    list: PropTypes.object.isRequired,
    presentation: PropTypes.object.isRequired,
    onDrop: PropTypes.func,
    onCardClick: PropTypes.func,
    onRemove: PropTypes.func,
    onMove: PropTypes.func.isRequired,
};

export default SortableCard;