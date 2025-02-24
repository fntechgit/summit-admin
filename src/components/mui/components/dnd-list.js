import React from "react";
import PropTypes from "prop-types";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Box } from "@mui/material";

const reorder = (list, startIndex, endIndex, updateOrderKey) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((item, index) => ({
    ...item,
    [updateOrderKey]: index + 1
  }));
};

const DragAndDropList = ({
  items,
  onReorder,
  renderItem,
  idKey,
  updateOrderKey,
  droppableId
}) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newItems = reorder(
      items,
      result.source.index,
      result.destination.index,
      updateOrderKey
    );
    onReorder(newItems);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {items.map((item, index) => (
              <Draggable
                key={String(item[idKey])}
                draggableId={String(item[idKey])}
                index={index}
              >
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    sx={{
                      background: snapshot.isDragging ? "#f0f0f0" : "inherit",
                      transition: "background 0.2s ease"
                    }}
                  >
                    {renderItem(item, index, provided, snapshot)}
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
};

DragAndDropList.propTypes = {
  items: PropTypes.array.isRequired,
  onReorder: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
  idKey: PropTypes.string,
  updateOrderKey: PropTypes.string,
  droppableId: PropTypes.string
};

DragAndDropList.defaultProps = {
  idKey: "id",
  updateOrderKey: "order",
  droppableId: "droppable"
};

export default DragAndDropList;
