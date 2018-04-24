import invariant from 'invariant';
import * as moment from 'moment';
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import uuid from 'uuid';
import CalendarItem from './components/CalendarPlan';
import * as Types from './types';
import elementFromPoint from './utils/elementFromPoint.js';
import {
  calculateIntervals,
  canAdd,
  canMove,
  createLookupTables,
  range
} from './utils/planner';

const intervalMatch = /(\d+)(m|h)+/;

interface IProps {
  dateEnd?: string;
  dateStart: string;
  days?: number;
  defaultPlanInterval?: number;
  end?: number;
  interval: string;
  plans: Types.IPlan[];
  start?: number;
}

export interface IState {
  byDate: Types.IByDate;
  cols: number;
  days: string[];
  grid: Types.IGrid;
  intervals: string[];
  plans: Types.IPlan[];
}

// TODO: We don't want to expose w,h,x,y but convert those to meaningful
// things.  How much information do we want to leave to the rnd state
// vs control ourselves.  Or do we want to look that information up
// each time we render?
class Calendar extends Component<IProps, IState> {
  private grid: any;
  private coordinates: Types.ICoordinates | null = null;

  constructor(props: IProps) {
    super(props);
    const {
      days,
      end = 24,
      dateStart,
      dateEnd,
      interval = '5m',
      start = 6
    } = props;

    // TODO: Update this so the dateState is required but endDate can be optional or
    // dervied from days.  Plans will only have dates.

    invariant(
      days || dateEnd,
      'Days, or end date is required.'
    );

    invariant(moment(dateStart, 'MM-DD-YYYY').isValid(), 'Start date must be valid.');

    if (days) {
      invariant(!Number.isNaN(days), 'Days must be a number or a date range.');
      invariant(days > 0, 'Days must be greater than one.');
    }

    if (dateEnd) {
      invariant(moment(dateEnd, 'MM-DD-YYYY').isValid(), 'End date must be valid.');
    }

    invariant(end >= start, 'End time cannot be less than or equal to start time');

    // get the time interval
    const regInterval = new RegExp(intervalMatch, 'g').exec(interval);
    const rawInterval = regInterval ? regInterval[1] : '5';
    // this will build all time intervals per day, this will get used for future lookups
    const intervals = calculateIntervals(parseInt(rawInterval, 10), start, end);

    const rangeDays = range(dateStart, dateEnd || days);

    const { byDate, grid } = createLookupTables(rangeDays, intervals);

    this.state = {
      byDate,
      grid,
      intervals,
      cols: rangeDays.length,
      days: rangeDays,
      plans: [{
        id: '1',
        // x: 0,
        // y: 0,
        // w: 1,
        // h: 1,
        time: 0,
        toTime: 1,
        date: '02/02/1985'
      }]
    };
  }

  public componentDidMount() {
    // Get the width and height of a single box at the time
    // to use that to calculate rough grids
    const grid = findDOMNode(this.grid).getBoundingClientRect();
    // tslint:disable-next-line
    // console.log(window.pageXOffset, window.pageYOffset, window.pageYOffset + grid.top, window.pageXOffset + grid.left);
    // const element = findDOMNode(this.spacer).getBoundingClientRect();
    // grab the width and height to be able to calculate click positions
    // const { width, height } = element;

    this.coordinates = {
      grid: {
        x: window.pageXOffset + grid.left,
        y: window.pageYOffset + grid.top
      },
      height: Math.round(50),
      width: Math.round(50)
    };

    // document.addEventListener('keydown', (event: any) => {
    //   if (event.keyCode === 27) {
    //     this.handleCloseModal();
    //   }
    // });
  }

  public render() {
    // TODO: width height should be based off columns, etc
    const { cols } = this.state;
    const width = cols * 50;
    return (
      <div>
        {this.renderDays()}
        {this.renderTimes()}
        <div
          className="planner-layout"
          onDoubleClick={this.handleAddPlan}
          ref={(ref: any) => { this.grid = ref; }}
          style={{ position: 'relative', height: '500px', width: `${width}px`, left: '50px' }}
        >
          {this.renderPlans()}
        </div>
      </div>
    );
  }

  private renderDays() {
    const { days } = this.state;
    const offset = 50;
    const renderedDays = days.map((day, index) => {
      return (
        <div
          key={day}
          style={{ left: `${index * 50}px`, width: '50px', display: 'inline-block' }}
        >
          <p style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{day}</p>
        </div>
      );
    });

    return (
      <div style={{ position: 'relative', left: `${offset}px` }}>
        {renderedDays}
      </div>
    );
  }

  private renderTimes() {
    const { intervals } = this.state;
    const offset = 50;
    const renderedIntervals = intervals.map((interval, index) => {
      return (
        <div
          key={interval}
          style={{ top: `${index * 50 + offset}px`, height: '50px', width: '50px', float: 'left' }}
        >
          <p style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{interval}</p>
        </div>
      );
    });

    return (
      <div style={{ width: '50px' }}>
        {renderedIntervals}
      </div>
    );
  }

  private renderPlans() {
    const { byDate, cols } = this.state;
    // TODO: type here
    return this.state.plans.map((plan: any) => {
      return (
        <CalendarItem
          cols={cols}
          h={plan.toTime}
          id={plan.id}
          key={plan.id}
          onUpdate={this.handleUpdatePlan}
          x={byDate[plan.date]}
          w={1}
          y={plan.time}
        />
      );
    });
  }

  private getGrid(event: any): { x: number; y: number} {
    const coordinates = this.coordinates;

    if (!coordinates) {
      // TODO: figure out what this should be
      return { x: 0, y: 0 };
    }

    // TODO: come from state
    const margin = [0, 0];
    // where the user clicked, minus the top left corner of the grid
    const xWithin = event.pageX - coordinates.grid.x;
    const yWithin = event.pageY - coordinates.grid.y;
    // this should give us the rough location of the click within the grid
    // adding 10 to account for the transformation margin between grid points
    // const y = Math.floor(yWithin / (coordinates.height + 10));
    // const x = Math.floor(xWithin / (coordinates.width + 10));
    const y = Math.floor(yWithin / (coordinates.height + margin[1]));
    const x = Math.floor(xWithin / (coordinates.width + margin[0]));

    // TODO: Might make more sense to adjust the coordinates here and then
    // everything else can work on the root grid, so 1,1 would === 0,0
    // then we wouldn't need to adjust everywhere else
    return { x, y };
  }

  private handleAddPlan = (event: any) => {
    const currentClick = elementFromPoint(event.clientX, event.clientY);
    // not a grid item
    if (currentClick.classList.contains('planner-layout')) {
      const { byDate, grid, plans } = this.state;
      // const { plans } = this.props;

      const { x, y } = this.getGrid(event);

      const defaultTo = this.props.defaultPlanInterval || 1;
      const isValidAdd = canAdd(x, y, defaultTo, { byDate, grid }, plans);

      if (isValidAdd) {
        const { start, toTime, startTime } = isValidAdd;
        this.setState({
          plans: [
            ...this.state.plans,
            {
              toTime,
              id: uuid.v4(),
              time: startTime,
              date: start.day
            }
          ]
        });
      }
    }
  }

  private handleUpdatePlan = (id: string, x: number, y: number, w: number, h: number) => {
    const { byDate, grid, plans } = this.state;
    const defaultTo = this.props.defaultPlanInterval || 1;

    const isValidAdd = canMove(id, x, y, defaultTo, { byDate, grid }, plans);

    if (isValidAdd) {
      const updatedPlans = this.state.plans.map((plan: any) => {
        if (plan.id !== id) {
          return plan;
        }

        return {
          ...plan,
          w,
          toTime: h,
          date: this.state.grid[x][y].day,
          time: y
        };
      });

      // for now set the state, but this should get switched out for call updater func
      this.setState({ plans: updatedPlans });
    }
  }
}

export default Calendar;
