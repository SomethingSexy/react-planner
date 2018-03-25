/* global window, document */
import invariant from 'invariant';
import { isEqual, uniq } from 'lodash';
import * as moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component, ReactNode } from 'react';
import { findDOMNode } from 'react-dom';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import { HotKeys } from 'react-hotkeys';
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

const UP = 'up';
const DOWN = 'down';
const RIGHT = 'right';
const LEFT = 'left';

const keyMap = {
  deleteNode: ['del', 'backspace'],
  moveNodeUp: [UP],
  moveNodeDown: [DOWN],
  moveNodeRight: [RIGHT],
  moveNodeLeft: [LEFT]
};

export interface IPlanner {
  dateEnd?: string;
  dateStart: string;
  days?: number;
  end?: number;
  interval: string;
  onUpdatePlans: (plans: Types.IPlan[]) => {};
  plans: Types.IPlan[];
  renderPlanEdit: Types.RenderPlanEdit;
  renderModal: Types.RenderModal;
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
  highlightedPlan: string | null;
}

// Add interval, which can be specific to start say, 1, 5, 15, 30, 1hour
// build matrix of days and times for quick look up when moving and expanding
// [1,1] = Sunday at 6:00
// [1,2] = Sunday at 6:05
export default class Planner extends Component<IPlanner, IPlannerState> {
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
    renderPlanEdit: PropTypes.func,
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
      selectedPlan: null,
      highlightedPlan: null
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

  public shouldComponentUpdate(nextProps: IPlanner, nextState: IPlannerState) {
    if (this.props.interval !== nextProps.interval
      || this.props.days !== nextProps.days
      || this.props.dateStart !== nextProps.dateStart
      || this.props.dateEnd !== nextProps.dateEnd
      || this.state.selectedPlan !== nextState.selectedPlan
      || !isEqual(this.props.plans, nextProps.plans)
      || this.state.highlightedPlan !== nextState.highlightedPlan
    ) {
      return true;
    }

    return false;
  }

  public componentWillReceiveProps(nextProps: IPlanner) {
    const { highlightedPlan } = this.state;
    const { interval, start, end, dateStart, dateEnd, days, plans } = nextProps;

    const regInterval = new RegExp(intervalMatch, 'g').exec(interval);
    const computedInterval = regInterval ? regInterval[1] : '5';
    // this will build all time intervals per day, this will get used for future lookups
    const intervals = calculateIntervals(
      parseInt(computedInterval, 10), start || 6, end || 24
    );

    const computedDays = range(dateStart, dateEnd || days);
    const gDaysOfWeek = gridDays(computedDays);
    // construct the lookup table, this will be an array of arrays to fast look up data about
    // the cross section of day and time.  [day][time]
    const lookup = createLookupTables(computedDays, intervals);

    // times for the view
    const gTimes = gridTimes(intervals);

    // given the plans, create the data necessary for the view
    const gPlans = gridPlans(plans, lookup);

    const nextState = {
      gDaysOfWeek,
      gTimes,
      highlightedPlan,
      intervals,
      lookup,
      gPlans,
      days: computedDays,
      planIds: plans.map(plan => plan.id),
    };

    // if we removed the plan then remove the highlighting
    if (!plans.find(plan => plan.id === highlightedPlan)) {
      nextState.highlightedPlan = null;
    }

    this.setState(nextState);
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
    const { gPlans, days } = this.state;

    // Setting it up this way because d.ts is not correct for rgl
    const rglProps: any = {
      className: 'layout',
      cols: days.length + 1,
      layout: gPlans,
      onLayoutChange: this.handleLayoutChange,
      ref: (ref: any) => { this.grid = ref; },
      rowHeight: 30,
      compactType: null,
      style: { overflowY: 'auto' } // TODO: Figure out how we want to handle this stuff
    };

    const handlers = {
      deleteNode: this.handleRemoveHighlightedPlan,
      moveNodeUp: this.handleMoveHighlightedPlan.bind(this.handleMoveHighlightedPlan, UP),
      moveNodeDown: this.handleMoveHighlightedPlan.bind(this.handleMoveHighlightedPlan, DOWN),
      moveNodeRight: this.handleMoveHighlightedPlan.bind(this.handleMoveHighlightedPlan, RIGHT),
      moveNodeLeft: this.handleMoveHighlightedPlan.bind(this.handleMoveHighlightedPlan, LEFT)
    };

    return (
      <HotKeys handlers={handlers} keyMap={keyMap}>
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
        {this.renderModal()}
      </HotKeys>
    );
  }

  private renderModal(): ReactNode {
    const { selectedPlan } = this.state;
    const { renderModal } = this.props;
    if (renderModal && selectedPlan) {
      return renderModal(selectedPlan, this.renderPlanEdit, !!selectedPlan);
    }
    return (
      <Modal
        contentLabel="Edit Plan"
        isOpen={!!selectedPlan}
      >
        {selectedPlan && this.renderPlanEdit(selectedPlan)}
      </Modal>
    );
  }

  private renderTimes(): ReactNode {
    const { gTimes } = this.state;
    return gTimes.map(
      time =>
        <div data-grid={time} key={time.i}><Time time={time.time} /></div>
    );
  }

  private renderDays(): ReactNode {
    const { gDaysOfWeek } = this.state;
    return gDaysOfWeek.map(day =>
      <div data-grid={day} key={day.key}><Day day={day.day} /></div>
    );
  }

  private renderPlans(): ReactNode {
    const { gPlans, highlightedPlan } = this.state;
    return gPlans.map(plan => (
      <div key={plan.i} style={{ border: '1px solid #eee' }}>
        <Plan
          highlightedPlan={highlightedPlan}
          plan={plan}
          onOpenPlan={this.handleOpenPlan}
          onRemovePlan={this.handleRemovePlan}
          onSelectPlan={this.handleSelectPlan}
        />
      </div>
    ));
  }

  private renderPlanEdit = (selectedPlan: Types.IPlan): ReactNode => {
    const { renderPlanEdit } = this.props;
    return (
      <EditPlan
        onEditPlan={this.handlePlanUpdate}
        plan={selectedPlan}
        render={renderPlanEdit}
      />
    );
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
    console.log('layout change'); // tslint:disable-line
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
            toTime: (nextPlan.y - 1) + (nextPlan.h - 1) + 1
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

      // TODO: toTime here is not working, using y here but when we process it we are
      // using that for height so it is getting borked
      onUpdatePlans([...plans, { id, date: dayTime.day, time: y - 1, toTime: y }]);
    }
  }

  private handleMoveHighlightedPlan = (direction: string) => {
    const { highlightedPlan } = this.state;
    const { plans } = this.props;

    if (highlightedPlan) {
      const planToMove = plans.find(plan => plan.id === highlightedPlan);
      if (planToMove && (direction === UP || direction === DOWN)) {
        // find the highlighted plan
        // find all of the plans with the same date
        // find the plan previous
        const times = plans
          .filter(plan => plan.date === planToMove.date)
          .sort((a, b) => a.time - b.time);

        const toMoveIndex = times.findIndex(plan => plan.id === planToMove.id);
        const moveTo = times[direction === UP ? toMoveIndex - 1 : toMoveIndex + 1];

        if (moveTo) {
          this.setState({ highlightedPlan: moveTo.id });
        }
      } else if (planToMove && (direction === RIGHT || direction === LEFT)) {
        // for left and right we need to get next and prev column
        const dates = uniq(
          plans
            .map(plan => plan.date)
          );

        const toMoveIndex = dates.indexOf(planToMove.date);
        const moveToDate = dates[direction === LEFT ? toMoveIndex - 1 : toMoveIndex + 1];

        if (moveToDate) {
          // now find the time we should move to
          const sorted = plans
            .filter(plan => plan.date === moveToDate)
            .sort((a, b) => a.time - b.time);

          const sameTime = sorted.find(plan => plan.time === planToMove.time);
          const moveTo = sameTime ? sameTime : sorted[0];

          if (moveTo) {
            this.setState({ highlightedPlan: moveTo.id });
          }
        }
      }
    }
  }

  private handleRemoveHighlightedPlan = () => {
    const { highlightedPlan } = this.state;

    if (highlightedPlan) {
      this.handleRemovePlan(highlightedPlan);
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

  private handleOpenPlan = (id: string) => {
    const { plans } = this.props;
    const selectedPlan = plans.find(plan => plan.id === id);
    this.setState({ selectedPlan: selectedPlan || null });
  }

  private handleSelectPlan = (id: string) => {
    this.setState({ highlightedPlan: id });
  }

  /**
   * Handles updating a plan with key and value.  All properties will
   * be stored at the root level.  It is up to the user to make sure
   * everything is in sync with the edit components.
   */
  private handlePlanUpdate = (id: string, name: string, value: any) => {
    const { onUpdatePlans, plans } = this.props;
    const updatedPlans = plans.map(plan => {
      if (plan.id !== id) {
        return plan;
      }

      return {
        ...plan,
        [name]: value
      };
    });

    onUpdatePlans(updatedPlans);
  }
}
