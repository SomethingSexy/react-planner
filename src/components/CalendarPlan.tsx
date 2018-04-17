import React, { Component } from 'react';
import RND from 'react-rnd';
import * as Types from '../types';

interface IReactDraggableCallbackData {
  node: HTMLElement;
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  lastX: number;
  lastY: number;
}

interface IPartialPosition { left: number; top: number; }

interface IPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface IProps {
  cols: number;
  id: string;
  onUpdate: Types.UpdatePlan;
  // starting x coordinate
  x: number;
  // starting y coordinate
  y: number;
}

interface IState {
  dragging?: {
    left: number;
    top: number;
  } | null;
  resizing?: {
    width: number;
    height: number;
  } | null;
  top: number;
  left: number;
}

const resize = {
  top: true,
  bottom: true
};

const style = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'solid 1px #ddd',
  background: '#f0f0f0',
};

const grid = [50, 50];

class CalendarItem extends Component<IProps, IState> {

  private rnd: any;

  constructor(props: IProps) {
    super(props);

    const { top, left } = this.calcPosition(props.x, props.y, 50, 50);

    this.state = {
      left,
      top
    };
  }

  public render() {
    const { top, left } = this.state;
    // for now let RND store x, y, width, and height
    return (
      <RND
        bounds="parent"
        default={{ x: top, y: left, width: 50, height: 50 }}
        dragGrid={grid}
        enableResizing={resize}
        minWidth={50}
        minHeight={50}
        onDragStart={this.onDragHandler('onDragStart')}
        onDrag={this.onDragHandler('onDrag')}
        onDragStop={this.onDragHandler('onDragStop')}
        ref={(c: any) => { this.rnd = c; }}
        resizeGrid={grid}
        style={style}
      >
        <div>balls</div>
      </RND>
    );
  }

  private calcColWidth(): number {
    // const cols = 10;
    // const containerWidth = 50;
    // const containerPadding = [0, 0];
    // const margin = [0, 0];
    // // const { margin, containerPadding, containerWidth, cols } = this.props;
    // return (
    //   (containerWidth - margin[0] * (cols - 1) - containerPadding[0] * 2) / cols
    // );
    return 50;
  }

  private calcPosition(
    x: number,
    y: number,
    w: number,
    h: number,
    state?: IState
  ): IPosition {
    const containerPadding = [0, 0];
    const rowHeight = 50;
    const margin = [0, 0];
    const colWidth = this.calcColWidth();

    const out = {
      left: Math.round((colWidth + margin[0]) * x + containerPadding[0]),
      top: Math.round((rowHeight + margin[1]) * y + containerPadding[1]),
      // 0 * Infinity === NaN, which causes problems with resize constraints;
      // Fix this if it occurs.
      // Note we do it here rather than later because Math.round(Infinity) causes deopt
      width:
        w === Infinity
          ? w
          : Math.round(colWidth * w + Math.max(0, w - 1) * margin[0]),
      height:
        h === Infinity
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

  private calcXY(top: number, left: number): { x: number, y: number } {
    const { cols } = this.props;
    const rowHeight = 50;
    const w = 1;
    const h = 1;
    const maxRows = 10;
    const margin = [0, 0];
    // const { margin, cols, rowHeight, w, h, maxRows } = this.props;
    const colWidth = this.calcColWidth();
    console.log('coloWidth', colWidth); // tslint:disable-line
    // left = colWidth * x + margin * (x + 1)
    // l = cx + m(x+1)
    // l = cx + mx + m
    // l - m = cx + mx
    // l - m = x(c + m)
    // (l - m) / (c + m) = x
    // x = (left - margin) / (coldWidth + margin)
    let x = Math.round((left - margin[0]) / (colWidth + margin[0]));
    let y = Math.round((top - margin[1]) / (rowHeight + margin[1]));
    console.log('x', x); // tslint:disable-line
    // Capping
    x = Math.max(Math.min(x, cols - w), 0);
    y = Math.max(Math.min(y, maxRows - h), 0);

    return { x, y };
  }

  private onDragHandler(handlerName: string) {
    return (_: Event, { node, deltaX, deltaY }: IReactDraggableCallbackData) => {
      const { cols } = this.props;
      // const handler = this.props[handlerName];
      // if (!handler) return;

      const newPosition: IPartialPosition = { top: 0, left: 0 };

      // Get new XY
      switch (handlerName) {
      case 'onDragStart': {
        // TODO: this wont work on nested parents
        const { offsetParent } = node;
        if (!offsetParent) {
          return;
        }
        const parentRect = offsetParent.getBoundingClientRect();
        const clientRect = node.getBoundingClientRect();
        newPosition.left =
          clientRect.left - parentRect.left + offsetParent.scrollLeft;
        newPosition.top =
          clientRect.top - parentRect.top + offsetParent.scrollTop;
        this.setState({ dragging: newPosition });
        break;
      }
      case 'onDrag':
        if (!this.state.dragging) {
          throw new Error('onDrag called before onDragStart.');
        }
        newPosition.left = this.state.dragging.left + deltaX;
        newPosition.top = this.state.dragging.top + deltaY;
        this.setState({ dragging: newPosition });
        break;
      case 'onDragStop':
        if (!this.state.dragging) {
          throw new Error('onDragEnd called before onDragStart.');
        }
        newPosition.left = this.state.dragging.left;
        newPosition.top = this.state.dragging.top;
        this.setState({ dragging: null });
        const { x, y } = this.calcXY(newPosition.top, newPosition.left);
        // This gives me a better grid position
        console.log(newPosition, x, y); // tslint:disable-line
        console.log('old', this.state.top, this.state.left, 'new', x, y); // tslint:disable-line
        // tell calendar that we have changed a plan's position
        this.props.onUpdate(this.props.id, x, y);
        if (x > cols) {
          // this was a test to undestand how x, y and update work
          const pos = this.calcPosition(x, y, 1, 1, this.state);
          this.rnd.updatePosition({ x: (pos.left - 50), y: pos.top });
        }
        break;
      default:
        throw new Error(
          'onDragHandler called with unrecognized handlerName: ' + handlerName
        );
      }

      // return handler.call(this, this.props.i, x, y, { e, node, newPosition });
    };
  }
}

export default CalendarItem;
