import React, { Component } from 'react';
import RND from 'react-rnd';
const resize = {
    // top: true,
    bottom: true
};
const style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'solid 1px #ddd',
    background: '#f0f0f0'
};
const grid = [100, 50];
class CalendarItem extends Component {
    constructor(props) {
        super(props);
        this.handleDragStart = (_, { node }) => {
            const newPosition = { top: 0, left: 0 };
            const { offsetParent } = node;
            if (!offsetParent) {
                return;
            }
            const parentRect = offsetParent.getBoundingClientRect();
            const clientRect = node.getBoundingClientRect();
            newPosition.left = clientRect.left - parentRect.left + offsetParent.scrollLeft;
            newPosition.top = clientRect.top - parentRect.top + offsetParent.scrollTop;
            this.setState({ dragging: newPosition });
        };
        this.handleDrag = (_, { deltaX, deltaY }) => {
            if (!this.state.dragging) {
                throw new Error('onDrag called before onDragStart.');
            }
            const newPosition = { top: 0, left: 0 };
            newPosition.left = this.state.dragging.left + deltaX;
            newPosition.top = this.state.dragging.top + deltaY;
            this.setState({ dragging: newPosition });
        };
        this.handleDragStop = (_, {}) => {
            const newPosition = { top: 0, left: 0 };
            if (!this.state.dragging) {
                throw new Error('onDragEnd called before onDragStart.');
            }
            newPosition.left = this.state.dragging.left;
            newPosition.top = this.state.dragging.top;
            this.setState({ dragging: null });
            const { x, y } = this.calcXY(newPosition.top, newPosition.left);
            // tell calendar that we have changed a plan's position
            this.props.onUpdate(this.props.id, x, y, this.props.w, this.props.h);
        };
        this.state = { top: 0, left: 0, bottom: 1 };
    }
    /**
     *
     * @param nextProps
     * @param nextState
     */
    static getDerivedStateFromProps(nextProps, nextState) {
        const { top, left } = CalendarItem
            .calcPosition(nextProps.x, nextProps.y, 50, 50, nextProps.containerWidth, nextProps.containerHeight, nextState);
        return {
            left,
            top,
            bottom: top + nextProps.h
        };
    }
    /**
     *
     * @param x
     * @param y
     * @param w
     * @param h
     * @param state
     */
    static calcPosition(x, y, w, h, containerWidth, containerHeight, state) {
        const containerPadding = [0, 0];
        const rowHeight = containerHeight;
        const margin = [0, 0];
        const colWidth = CalendarItem.calcColWidth(containerWidth);
        const out = {
            left: Math.round((colWidth + margin[0]) * x + containerPadding[0]),
            top: Math.round((rowHeight + margin[1]) * y + containerPadding[1]),
            // 0 * Infinity === NaN, which causes problems with resize constraints;
            // Fix this if it occurs.
            // Note we do it here rather than later because Math.round(Infinity) causes deopt
            width: w === Infinity
                ? w
                : Math.round(colWidth * w + Math.max(0, w - 1) * margin[0]),
            height: h === Infinity
                ? h
                : Math.round(rowHeight * h + Math.max(0, h - 1) * margin[1])
        };
        if (state && state.resizing) {
            out.width = Math.round(state.resizing.width);
            out.height = Math.round(state.resizing.height);
        }
        if (state && state.dragging) {
            out.top = Math.round(state.dragging.top);
            out.left = Math.round(state.dragging.left);
        }
        return out;
    }
    static calcColWidth(containerWidth) {
        // const cols = 10;
        // const containerWidth = 50;
        // const containerPadding = [0, 0];
        // const margin = [0, 0];
        // const { margin, containerPadding, containerWidth, cols } = this.props;
        // return (
        //   (containerWidth - margin[0] * (cols - 1) - containerPadding[0] * 2) / cols
        // );
        return containerWidth;
    }
    render() {
        const { children, containerHeight, containerWidth } = this.props;
        const { top, left } = this.state;
        // for now let RND store x, y, width, and height
        return (React.createElement(RND, { bounds: "parent", default: { height: `${containerHeight}px` }, dragGrid: grid, enableResizing: resize, height: containerHeight, maxWidth: containerWidth, minWidth: containerWidth, minHeight: containerHeight, onDragStart: this.handleDragStart, onDrag: this.handleDrag, onDragStop: this.handleDragStop, onResizeStop: this.handleResize(), position: { x: left, y: top }, resizeGrid: grid, style: style }, children));
    }
    calcXY(top, left) {
        const { cols, containerHeight, containerWidth } = this.props;
        const w = 1;
        const h = 1;
        const maxRows = 10;
        const margin = [0, 0];
        // const { margin, cols, rowHeight, w, h, maxRows } = this.props;
        const colWidth = CalendarItem.calcColWidth(containerWidth);
        // left = colWidth * x + margin * (x + 1)
        // l = cx + m(x+1)
        // l = cx + mx + m
        // l - m = cx + mx
        // l - m = x(c + m)
        // (l - m) / (c + m) = x
        // x = (left - margin) / (coldWidth + margin)
        let x = Math.round((left - margin[0]) / (colWidth + margin[0]));
        let y = Math.round((top - margin[1]) / (containerHeight + margin[1]));
        // Capping
        x = Math.max(Math.min(x, cols - w), 0);
        y = Math.max(Math.min(y, maxRows - h), 0);
        return { x, y };
    }
    calcWH({ height, width }, direction) {
        const { cols, containerHeight, containerWidth } = this.props;
        const maxRows = 10;
        const margin = [0, 0];
        const { x, y } = this.props;
        const colWidth = CalendarItem.calcColWidth(containerWidth);
        let w;
        let h;
        // width = colWidth * w - (margin * (w - 1))
        // ...
        // w = (width + margin) / (colWidth + margin)
        w = Math.round((width + margin[0]) / (colWidth + margin[0]));
        if (direction === 'bottom') {
            h = Math.round((height + margin[1]) / (containerHeight + margin[1])) + this.props.h;
        }
        else {
            h = Math.round((height + margin[1]) / (containerHeight + margin[1]));
        }
        // Capping
        w = Math.max(Math.min(w, cols - x), 0);
        h = Math.max(Math.min(h, maxRows - y), 0);
        return { w, h };
    }
    handleResize() {
        return ({}, direction, {}, delta) => {
            const { cols, x, y, id } = this.props;
            // come from props or static
            const minW = 1; // grid count
            const minH = 1; // grid count
            const maxW = 500; // total rows
            const maxRows = 10;
            // Get new X
            let { w, h } = this.calcWH(delta, direction);
            // Cap w at numCols
            w = Math.min(w, cols - x);
            // Ensure w is at least 1
            w = Math.max(w, 1);
            // Min/max capping
            w = Math.max(Math.min(w, maxW), minW);
            h = Math.max(Math.min(h, maxRows), minH);
            this.props.onUpdate(id, x, y, w, h);
        };
    }
}
export default CalendarItem;
//# sourceMappingURL=CalendarItem.js.map