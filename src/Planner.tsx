/* global window, document */
import invariant from 'invariant';
import * as moment from 'moment';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { findDOMNode } from 'react-dom';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';  // tslint:disable-line
import Modal from 'react-modal';
import 'react-resizable/css/styles.css';  // tslint:disable-line
import uuid from 'uuid';
import { INTERVALS } from './constants.js';
import Day from './Day.js';
import EditPlan from './EditPlan.js';
import Plan from './Plan.js';
import Time from './Time.js';
import * as Types from './types';
import elementFromPoint from './utils/elementFromPoint.js';
import {
  calculateIntervals,
  createLookupTables,
  gridDays,
  gridPlans,
  gridTimes,
  range,
} from './utils/planner';

const WidthReactGridLayout = WidthProvider(ReactGridLayout);

// const validIntervals = [1, 5, 15, 30, 60];
const intervalMatch = /(\d+)(m|h)+/;
const spacer = { x: 0, y: 0, w: 1, h: 1, static: true };

export interface IPlanner {
  dateEnd?: string;
  dateStart: string;
  days?: number;
  end?: number;
  interval: string;
  onUpdatePlans: (plans: Types.IPlan[]) => {};
  plans: Types.IPlan[];
  start?: number;
}

export interface IPlannerState {
  days: string[];
  gDaysOfWeek: Types.IGridDay[];
  gPlans: Types.IGridPlan[];
  gTimes: Types.IGridTime[];
  intervals: string[];
  lookup: Types.ILookup;
  planIds: string[];
  selectedPlan: Types.IPlan | null;
}

// Add interval, which can be specific to start say, 1, 5, 15, 30, 1hour
// build matrix of days and times for quick look up when moving and expanding
// [1,1] = Sunday at 6:00
// [1,2] = Sunday at 6:05
export default class Planner extends PureComponent<IPlanner, IPlannerState> {
  public static propTypes = {
    // for now Sunday = 0, Saturday = 6
    dateStart: PropTypes.string,
    dateEnd: PropTypes.string,
    days: PropTypes.oneOfType([PropTypes.number]).isRequired,
    end: PropTypes.number,
    interval: PropTypes.oneOf(INTERVALS),
    // for now it will be an array of plans
    // the index should correspond to the days to start
    plans: PropTypes.arrayOf(
      PropTypes.shape({
        // for now this needs to corresponds to days, 0 - 6
        date: PropTypes.string,
        // should be optional at some point
        id: PropTypes.string,
        label: PropTypes.string,
        // for now time corresponds to the index of the interval.
        // TODO: Convert this to physical time and build from there
        time: PropTypes.number
      })
    ),
    start: PropTypes.number,
    onUpdatePlans: PropTypes.func
  };

  public static defaultProps: Partial<IPlanner> = {
    end: 24,
    interval: '5m',
    plans: [],
    start: 6
  };

  private grid: any;
  private spacer: any;
  private coordinates: Types.ICoordinates | null = null;

  constructor(props: IPlanner) {
    super(props);
    const {
      days,
      end = 24,
      interval = '5m',
      start = 6,
      // plans = [],
      dateStart,
      dateEnd
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

    // construt lookup table, used to communicate between incoming data and rgl
    const lookup = createLookupTables(rangeDays, intervals);

    // times for the view
    const gTimes = gridTimes(intervals);

    // days for the view, unfortunately with the way RGL works we need to add this to direct child
    const gDaysOfWeek = gridDays(rangeDays);

    // given the plans, create the data necessary for the view
    const gPlans = gridPlans(props.plans, lookup);

    this.state = {
      gDaysOfWeek,
      gPlans,
      gTimes,
      intervals,
      lookup,
      days: rangeDays,
      // use for quick lookup
      planIds: props.plans.map(plan => plan.id),
      selectedPlan: null
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
    if (this.props.interval !== nextProps.interval
      || this.props.days !== nextProps.days
      || this.props.dateStart !== nextProps.dateStart
      || this.props.dateEnd !== nextProps.dateEnd
      || this.props.plans !== nextProps.plans
    ) {
      const regInterval = new RegExp(intervalMatch, 'g').exec(nextProps.interval);
      const interval = regInterval ? regInterval[1] : '5';
      // this will build all time intervals per day, this will get used for future lookups
      const intervals = calculateIntervals(
        parseInt(interval, 10), nextProps.start || 6, nextProps.end || 24
      );

      const days = range(nextProps.dateStart, nextProps.dateEnd || nextProps.days);
      const gDaysOfWeek = gridDays(days);
      // construct the lookup table, this will be an array of arrays to fast look up data about
      // the cross section of day and time.  [day][time]
      const lookup = createLookupTables(days, intervals);

      // times for the view
      const gTimes = gridTimes(intervals);

      // given the plans, create the data necessary for the view
      const gPlans = gridPlans(nextProps.plans, lookup);

      this.setState({
        days,
        gDaysOfWeek,
        gTimes,
        intervals,
        lookup,
        gPlans,
        planIds: nextProps.plans.map(plan => plan.id)
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
    const { gPlans, days, selectedPlan } = this.state;

    // Setting it up this way because d.ts is not correct for rgl
    const rglProps: any = {
      className: 'layout',
      cols: days.length + 1,
      layout: gPlans,
      onLayoutChange: this.handleLayoutChange,
      ref: (ref: any) => { this.grid = ref; },
      rowHeight: 30,
      compactType: null
    };

    return (
      <div>
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
          onDoubleClick={this.handleAddPlan}
        >
          <WidthReactGridLayout
            {...rglProps}
          >
            <div data-grid={spacer} key="spacer" ref={ref => { this.spacer = ref; }} />
            {this.renderTimes()}
            {this.renderDays()}
            {this.renderPlans()}
          </WidthReactGridLayout>
        </div>
        <Modal
          contentLabel="Edit Plan"
          isOpen={!!selectedPlan}
        >
         {selectedPlan && <EditPlan plan={selectedPlan} />}
        </Modal>
      </div>
    );
  }

  private renderTimes() {
    const { gTimes } = this.state;
    return gTimes.map(
      time =>
        <div data-grid={time} key={time.i}><Time time={time.time} /></div>
    );
  }

  private renderDays() {
    const { gDaysOfWeek } = this.state;
    return gDaysOfWeek.map(day =>
      <div data-grid={day} key={day.key}><Day day={day.day} /></div>
    );
  }

  private renderPlans() {
    const { gPlans } = this.state;
    return gPlans.map(plan => (
      <div key={plan.i} style={{ border: '1px solid #eee' }}>
        <Plan
          plan={plan}
          onRemovePlan={this.handleRemovePlan}
          onSelectPlan={this.handleSelectPlan}
        />
      </div>
    ));
  }

  private getGrid(event: any): { x: number; y: number} {
    const coordinates = this.coordinates;

    if (!coordinates) {
      // TODO: figure out what this should be
      return { x: 0, y: 0 };
    }

    // where the user clicked, minus the top left corner of the grid
    const xWithin = event.pageX - coordinates.grid.x;
    const yWithin = event.pageY - coordinates.grid.y;
    // this should give us the rough location of the click within the grid
    // adding 10 to account for the transformation margin between grid points
    const y = Math.floor(yWithin / (coordinates.height + 10));
    const x = Math.floor(xWithin / (coordinates.width + 10));

    return { x, y };
  }

  private isValidMove(plan: Types.IGridPlan) {
    const { lookup } = this.state;
    if (typeof lookup.grid[plan.x] === 'undefined') {
      return false;
    }

    if (typeof lookup.grid[plan.x][plan.y] === 'undefined') {
      return false;
    }

    return true;
  }

  private handleCloseModal = () => {
    this.setState({ selectedPlan: null });
  }

  private handleLayoutChange = (layout: any) => {
    const { gPlans, lookup, planIds } = this.state;
    const { plans, onUpdatePlans } = this.props;
    // grab the plans
    const nextPlans = layout.filter((item: any) => planIds.indexOf(item.i) !== -1);

    // compare the next plans with the currently visible plans, saving off any
    // that we know of changed
    const changed = nextPlans.filter((nextPlan: any) => {
      const plan = gPlans.find(gPlan => gPlan.i === nextPlan.i);
      // start with moving
      if (plan && (plan.x !== nextPlan.x || plan.y !== nextPlan.y || plan.h !== nextPlan.h)) {
        return true;
      }
      return false;
    });

    // if something has changed, then lets update the grid plans
    if (changed.length) {
      const updatedPlans = plans.map(plan => {
        const nextPlan = changed.find((c: { i: string}) => c.i === plan.id);
        if (nextPlan && this.isValidMove(nextPlan)) {
          // const dayTime = lookup.grid[nextPlan.x - 1][nextPlan.y - 1];
          // const toTime = lookup.grid[nextPlan.x - 1][(nextPlan.y - 1) + (nextPlan.h - 1) + 1];
          return {
            ...plan,
            date: lookup.grid[nextPlan.x - 1][nextPlan.y - 1].day,
            time: nextPlan.y - 1,
            toTime: nextPlan.h
          };
        }

        return plan;
      });
      onUpdatePlans(updatedPlans);
    }
  }

  private handleAddPlan = (event: any) => {
    const currentClick = elementFromPoint(event.clientX, event.clientY);
    // not a grid item
    if (currentClick.classList.contains('react-grid-layout')) {
      const { lookup } = this.state;
      const { onUpdatePlans, plans } = this.props;
      const { x, y } = this.getGrid(event);
      const dayTime = lookup.grid[x - 1][y - 1];
      const id = uuid.v4();

      // TODO: toTime here is not working
      onUpdatePlans([...plans, { id, date: dayTime.day, time: y - 1, toTime: y }]);
    }
  }

  private handleRemovePlan = (id: string) => {
    const { plans, onUpdatePlans } = this.props;
    const index = plans.findIndex(plan => plan.id === id);
    let updatedPlans;
    if (index === 0) {
      updatedPlans = plans.slice(index + 1);
    } else {
      updatedPlans = [
        ...plans.slice(0, index),
        ...plans.slice(index + 1)
      ];
    }

    onUpdatePlans(updatedPlans);
  }

  private handleSelectPlan = (id: string) => {
    const { plans } = this.props;
    const selectedPlan = plans.find(plan => plan.id === id);
    this.setState({ selectedPlan: selectedPlan || null });
  }
}
