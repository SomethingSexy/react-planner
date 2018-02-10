/* global window, document */
import invariant from 'invariant';
import PropTypes from 'prop-types';
import React, { PureComponent, ReactInstance } from 'react';
import { findDOMNode } from 'react-dom';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';  // tslint:disable-line
import Modal from 'react-modal';
import 'react-resizable/css/styles.css';  // tslint:disable-line
import uuid from 'uuid';
import { INTERVALS } from './constants.js';
import Day from './Day.js';
import Plan from './Plan.js';
import Time from './Time.js';
import * as Types from './types';
import elementFromPoint from './utils/elementFromPoint.js';
import { calculateIntervals, gridTimes, lookupTable, range } from './utils/planner';

const WidthReactGridLayout = WidthProvider(ReactGridLayout);

// const validIntervals = [1, 5, 15, 30, 60];
const intervalMatch = /(\d+)(m|h)+/;
const spacer = { x: 0, y: 0, w: 1, h: 1, static: true };

export interface IPlanner {
  days: number;
  end: number;
  interval: string;
  plans: [{ day: number; id: string; time: number; }];
  start: number;
}

interface IPlannerState {
  days: number[];
  gDaysOfWeek: object[];
  gPlans: object[];
  gTimes: object[];
  intervals: string[];
  lookup: Types.lookUpTable;
  planIds: string[];
}

// Add interval, which can be specific to start say, 1, 5, 15, 30, 1hour
// build matrix of days and times for quick look up when moving and expanding
// [1,1] = Sunday at 6:00
// [1,2] = Sunday at 6:05
export default class Planner extends PureComponent<IPlanner, IPlannerState> {
  public static propTypes = {
    // for now Sunday = 0, Saturday = 6
    days: PropTypes.oneOfType([PropTypes.number]).isRequired,
    end: PropTypes.number,
    interval: PropTypes.oneOf(INTERVALS),
    // for now it will be an array of plans
    // the index should correspond to the days to start
    plans: PropTypes.arrayOf(
      PropTypes.shape({
        // for now this needs to corresponds to days, 0 - 6
        day: PropTypes.number,
        // should be optional at some point
        id: PropTypes.string,
        label: PropTypes.string,
        // for now time corresponds to the index of the interval.
        // TODO: Convert this to physical time and build from there
        time: PropTypes.number
      })
    ),
    start: PropTypes.number
  };

  public static defaultProps = {
    end: 24,
    interval: '5m',
    start: 6
  };

  private grid: any;
  private spacer: any;
  private coordinates: object;

  constructor(props: IPlanner) {
    super(props);

    invariant(props.end >= props.start, 'End time cannot be less than or equal to start time');
    invariant(!Number.isNaN(props.days), 'Days must be a number or a date range.');
    invariant(props.days > 0, 'Days must be greater than one.');

    this.coordinates = {};

    // get the time interval
    const regInterval = new RegExp(intervalMatch, 'g').exec(props.interval);
    const interval = regInterval ? regInterval[1] : '5';

    // this will build all time intervals per day, this will get used for future lookups
    const intervals = calculateIntervals(parseInt(interval, 10), props.start, props.end);

    const days = range(props.days);

    // construct the lookup table, this will be an array of arrays to fast look up data about
    // the cross section of day and time.  [day][time]
    const lookup = lookupTable(intervals, days);

    // times for the view
    const gTimes = gridTimes(intervals);

    // days for the view, unfortunately with the way RGL works we need to add this to direct child
    const gDaysOfWeek = days.map(day =>
      ({ day, x: day, y: 0, w: 1, h: 1, static: true, key: uuid.v4() }));

    // given the plans, create the data necessary for the view
    const gPlans = props.plans.map(plan => {
      const dayTime = lookup[plan.day - 1][plan.time];
      const toTime = lookup[plan.day - 1][plan.time + 1];
      return {
        h: 1,
        i: plan.id,
        label: `${dayTime.day}: ${dayTime.time} - ${toTime.time}`,
        w: 1,
        x: plan.day,
        y: plan.time + 1,
      };
    });

    this.state = {
      days,
      gDaysOfWeek,
      gPlans,
      gTimes,
      intervals,
      lookup,
      // use for quick lookup
      planIds: props.plans.map(plan => plan.id),
    };
  }

  public componentDidMount() {
    // Get the width and height of a single box at the time
    // to use that to calculate rough grids
    const grid = findDOMNode(this.grid).getBoundingClientRect();
    // tslint:disable-next-line
    // console.log(window.pageXOffset, window.pageYOffset, window.pageYOffset + grid.top, window.pageXOffset + grid.left);
    const element = findDOMNode(this.spacer).getBoundingClientRect();
    // grab the width and height to be able to calculate click positions
    const { width, height } = element;

    this.coordinates = {
      grid: {
        x: window.pageXOffset + grid.left,
        y: window.pageYOffset + grid.top
      },
      height: Math.round(height),
      width: Math.round(width)
    };

    document.addEventListener('keydown', this.handleCloseModal);
  }

  public componentWillReceiveProps(nextProps: IPlanner) {
    if (this.props.interval !== nextProps.interval || this.props.days !== nextProps.days) {
      const interval = new RegExp(intervalMatch, 'g').exec(nextProps.interval)[1];
      // this will build all time intervals per day, this will get used for future lookups
      const intervals = calculateIntervals(parseInt(interval, 10), nextProps.start, nextProps.end);

      const days = range(nextProps.days);
      const gDaysOfWeek = days.map(day =>
        ({ day, x: day, y: 0, w: 1, h: 1, static: true, key: uuid.v4() }));
      // construct the lookup table, this will be an array of arrays to fast look up data about
      // the cross section of day and time.  [day][time]
      const lookup = lookupTable(intervals, days);

      // times for the view
      const gTimes = gridTimes(intervals);

      this.setState({
        days,
        gDaysOfWeek,
        gTimes,
        intervals,
        lookup
      });
    }
  }

  public componentDidUpdate() {
    // Get the width and height of a single box at the time
    // to use that to calculate rough grids
    const grid = findDOMNode(this.grid).getBoundingClientRect();
    // tslint:disable-next-line
    // console.log(window.pageXOffset, window.pageYOffset, window.pageYOffset + grid.top, window.pageXOffset + grid.left);
    const element = findDOMNode(this.spacer).getBoundingClientRect();
    // grab the width and height to be able to calculate click positions
    const { width, height } = element;

    this.coordinates = {
      grid: {
        x: window.pageXOffset + grid.left,
        y: window.pageYOffset + grid.top
      },
      height: Math.round(height),
      width: Math.round(width),
    };
  }

  public componentWillUnmount() {
    document.removeEventListener('keydown', this.handleCloseModal);
  }

  public render() {
    const { gDaysOfWeek, gTimes, gPlans, days } = this.state;
    return (
      <div>
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
          onDoubleClick={this.handleAddPlan}
        >
          <WidthReactGridLayout
            className="layout"
            cols={days.length + 1}
            layout={gPlans}
            ref={ref => { this.grid = ref; }}
            rowHeight={30}
            verticalCompact={false}
            onLayoutChange={this.handleLayoutChange}
          >
            <div data-grid={spacer} key="spacer" ref={ref => { this.spacer = ref; }} />
            {gTimes.map(time =>
              <div data-grid={time} key={time.i}><Time time={time.time} /></div>)}
            {gDaysOfWeek.map(day =>
              <div data-grid={day} key={day.key}><Day day={day.day} /></div>)}
            {gPlans.map(plan => (
              <div key={plan.i} style={{ border: '1px solid #eee' }}>
                <Plan
                  plan={plan}
                  onRemovePlan={this.handleRemovePlan}
                  onSelectPlan={this.handleSelectPlan}
                />
              </div>
            ))}
          </WidthReactGridLayout>
        </div>
        <Modal
          contentLabel="Edit Plan"
          isOpen={!!this.state.selectedPlan}
        >
          {this.state.selectedPlan}
        </Modal>
      </div>
    );
  }

  private getGrid(event: any) {
    const coordinates = this.coordinates;
    // where the user clicked, minus the top left corner of the grid
    const xWithin = event.pageX - coordinates.grid.x;
    const yWithin = event.pageY - coordinates.grid.y;
    // this should give us the rough location of the click within the grid
    // adding 10 to account for the transformation margin between grid points
    const y = Math.floor(yWithin / (coordinates.height + 10));
    const x = Math.floor(xWithin / (coordinates.width + 10));

    return { x, y };
  }

  private isValidMove(plan) {
    const { lookup } = this.state;
    if (typeof lookup[plan.x] === 'undefined') {
      return false;
    }

    if (typeof lookup[plan.x][plan.y] === 'undefined') {
      return false;
    }

    return true;
  }

  private handleCloseModal = () => {
    this.setState({ selectedPlan: null });
  }

  private handleLayoutChange = layout => {
    const { gPlans, lookup, planIds } = this.state;
    // grab the plans
    const nextPlans = layout.filter(item => planIds.indexOf(item.i) !== -1);

    // compare the next plans with the currently visible plans, saving off any
    // that we know of changed
    const changed = nextPlans.filter(nextPlan => {
      const plan = gPlans.find(gPlan => gPlan.i === nextPlan.i);
      // start with moving
      if (plan.x !== nextPlan.x || plan.y !== nextPlan.y || plan.h !== nextPlan.h) {
        return true;
      }
      return false;
    });

    // if something has changed, then lets update the grid plans
    if (changed.length) {
      const updatedgPlans = gPlans.map(plan => {
        const nextPlan = changed.find(c => c.i === plan.i);

        if (nextPlan && this.isValidMove(nextPlan)) {
          const dayTime = lookup[nextPlan.x - 1][nextPlan.y - 1];
          const toTime = lookup[nextPlan.x - 1][(nextPlan.y - 1) + (nextPlan.h - 1) + 1];
          return {
            ...plan,
            label: `${dayTime.day}: ${dayTime.time} - ${toTime.time}`,
            x: nextPlan.x,
            y: nextPlan.y,
            h: nextPlan.h
          };
        }

        return { ...plan };
      });
      this.setState({ gPlans: updatedgPlans });
    }
  }

  private handleAddPlan = event => {
    const currentClick = elementFromPoint(event.clientX, event.clientY);
    // not a grid item
    if (currentClick.classList.contains('react-grid-layout')) {
      const { gPlans, lookup, planIds } = this.state;
      const { x, y } = this.getGrid(event);
      const dayTime = lookup[x - 1][y - 1];
      const toTime = lookup[x - 1][(y - 1) + 1];
      const id = uuid.v4();
      // TODO: need to formally add this to plans
      this.setState({
        gPlans: [...gPlans, {
          label: `${dayTime.day}: ${dayTime.time} - ${toTime.time}`,
          x,
          y,
          h: 1,
          w: 1,
          i: id
        }],
        planIds: [...planIds, id]
      });
    }
  }

  private handleRemovePlan = id => {
    const index = this.state.gPlans.findIndex(plan => plan.i === id);
    if (index === 0) {
      this.setState({
        gPlans: this.state.gPlans.slice(index + 1)
      });
    } else {
      this.setState({
        gPlans: [
          ...this.state.gPlans.slice(0, index),
          ...this.state.gPlans.slice(index + 1)
        ]
      });
    }
  }

  private handleSelectPlan = id => {
    this.setState({ selectedPlan: id });
  }
}
