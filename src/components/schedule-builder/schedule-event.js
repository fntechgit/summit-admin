/**
 * Copyright 2017 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
import React, {useState} from 'react';
import { DraggableItemTypes } from './draggable-items-types';
import { useDrag } from 'react-dnd';
import {Popover, OverlayTrigger} from 'react-bootstrap';
import { RawHTML } from 'openstack-uicore-foundation/lib/components';
import ReactDOM from "react-dom";

const RESIZING_DIR_NORTH = 'N';
const RESIZING_DIR_SOUTH = 'S';

const IsResizeClass = new RegExp('(\\s|^)is-resizable(\\s|$)');

const ScheduleEvent = ({event, step, initialTop, initialHeight, minHeight, maxHeight, canResize, onResized, onUnPublishEvent, onEditEvent, onClickSelected, selectedPublishedEvents}) => {
    const [collected, drag] = useDrag(() => ({
        type: DraggableItemTypes.SCHEDULEEVENT,
        item: { ...event }
    }));
    const [top, setTop] = useState(initialTop);
    const [height, setHeight] = useState(initialHeight);
    const [resizing, setResizing] = useState(false);
    const [resizeInfo, setResizeInfo] = useState(null);
    const isSelected = selectedPublishedEvents.includes(event.id);

    const getInlineStyles = () => {
        return {
            top,
            height,
            opacity: collected.isDragging ? 0.5 : 1,
            cursor: 'move',
        };
    }

    const popoverHoverFocus = () =>
        <Popover id="popover-trigger-focus" title={event.title}>
            <RawHTML>{event.description}</RawHTML>
        </Popover>

    // resize behavior

    const onMouseDown = (evt) => {
        if (!evt.target.getAttribute('data-resizable')) return;
        const box = ReactDOM.findDOMNode(drag.current).getBoundingClientRect();

        let type;
        if (evt.clientY - box.top < 10) {
            type =  RESIZING_DIR_NORTH;
        } else if (box.bottom - evt.clientY < 10) {
            type = RESIZING_DIR_SOUTH;
        } else {
            return;
        }

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);

        setResizing(true);
        setResizeInfo({type, startYPos : evt.pageY, lastYPos: evt.pageY, prevTop: top, prevHeight: height})
        evt.preventDefault();
    }

    const onMouseMove = (evt) => {
        if(!resizing) return;

        let lastYPos = resizeInfo.lastYPos;
        let newYPos  = evt.pageY;
        let deltaY   = newYPos - lastYPos;

        if(step && step > 0){
            let steps = parseInt(Math.round(Math.abs(deltaY) / step));
            deltaY    = Math.sign(deltaY) * steps * step;
            if(!deltaY){
                evt.preventDefault();
                return false;
            }
        }

        let newHeight = height;
        let newTop    = top;

        if(resizeInfo.type === RESIZING_DIR_SOUTH) {
            newHeight = height + deltaY;
        }

        if(resizeInfo.type === RESIZING_DIR_NORTH){
            if(deltaY < 0){
                newTop = top - Math.abs(deltaY);
                newHeight = height + Math.abs(deltaY);
            }
            else{
                newTop    = top + Math.abs(deltaY);
                newHeight = height - Math.abs(deltaY);
            }
        }

        // check constraints
        if(newHeight < minHeight){
            newHeight = minHeight;
            newYPos   = lastYPos;
            newTop    = top;
        }

        let maxHeightTmp = (typeof maxHeight === "function") ? maxHeight() : maxHeight;

        if (newHeight > maxHeightTmp) {
            newHeight = maxHeightTmp;
            newYPos   = lastYPos;
            newTop    = top;
        }

        if (newTop < 0) {
            newTop    = 0;
            newHeight = height;
            newYPos   = lastYPos;
        }

        if (canBeResized(newTop, newHeight)) {
            setTop(newTop);
            setHeight(newHeight);
            setResizeInfo({...resizeInfo, lastYPos: newYPos})
        }

        evt.preventDefault();
    }

    const onMouseUp = (evt) => {
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mouseup', onMouseUp, false);
        setResizing(false);
        setResizeInfo(null)
        if(onResized){
            return onResized(event.id, top, height);
        }
        evt.preventDefault();
    }

    const canBeResized = (newTop, newHeight) => {
        return canResize ? canResize(event.id, newTop, newHeight) : true;
    }

    // end resize behavior

    return (
        <div
            className="row schedule-event is-resizable"
            data-resizable={true}
            id={`event_${event.id}`}
            onMouseDown={onMouseDown}
            ref={drag}
            style={getInlineStyles()}
        >
            <div className="row">
                <div className="col-md-12">
                    <div className="event-select-wrapper">
                        <input className="select-event-btn"
                               id={`selected_event_${event.id}`}
                               type="checkbox"
                               checked={isSelected}
                               onClick={() => onClickSelected(event)}/>
                    </div>
                    <div className="col-md-12 event-container">
                        <div className="event-content">
                            <OverlayTrigger trigger={['hover']} placement="bottom" overlay={popoverHoverFocus()}>
                                <span className="event-title">{event.title}</span>
                            </OverlayTrigger>
                        </div>
                    </div>
                    <div className="event-actions">
                        <i className="fa fa-minus-circle unpublish-event-btn" aria-hidden="true" title="unpublish event" onClick={() => onUnPublishEvent(event)}/>
                        <i className="fa fa-pencil-square-o edit-published-event-btn" title="edit event" aria-hidden="true" onClick={() => onEditEvent(event)}/>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScheduleEvent;
