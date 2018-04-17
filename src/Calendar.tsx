import invariant from 'invariant';
import * as moment from 'moment';
import React, { Component } from 'react';
import CalendarItem from './components/CalendarPlan';
import * as Types from './types';
import {
  calculateIntervals,
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
}

class Calendar extends Component<IProps, IState> {
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
      days: rangeDays
    };
  }

  public render() {
    // TODO: width height should be based off columns, etc
    const { cols } = this.state;
    const width = cols * 50;
    return (
      <div>
        {this.renderDays()}
        {this.renderTimes()}
        <div style={{ position: 'relative', height: '500px', width: `${width}px`, left: '50px' }}>
          <CalendarItem cols={cols} id="1" onUpdate={this.handleUpdatePlan} x={1} y={1} />
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

  private handleUpdatePlan = (id: string, x: number, y: number) => {
    console.log(id, x, y); // tslint:disable-line
    console.log(this.state.grid[x][y]) // tslint:disable-line
  }
}

export default Calendar;
