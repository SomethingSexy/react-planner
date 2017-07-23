/* global window, document */
import React, { PureComponent } from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import uuid from 'uuid';
import moment from 'moment';
import invariant from 'invariant';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Modal from 'react-modal';
import elementFromPoint from './utils/elementFromPoint.js';
import { INTERVALS } from './constants.js';
import Day from './Day.js';
import Time from './Time.js';
import Plan from './Plan.js';

const WidthReactGridLayout = WidthProvider(ReactGridLayout);

const MINUTES = 60;
// const validIntervals = [1, 5, 15, 30, 60];
const intervalMatch = /(\d+)(m|h)+/;
const spacer = { x: 0, y: 0, w: 1, h: 1, static: true };

const calculateIntervals = (interval, start, end) => {
  const intervals = (MINUTES / interval) * (end - start);
  const times = [];
  let startTime = moment.duration(start, 'hours');
  for (let x = 0; x < intervals; x++) { // eslint-disable-line no-plusplus
    if (startTime.get('minutes') + interval === 60) {
      startTime = moment.duration(startTime.get('hours') + 1, 'hours');
    } else if (x !== 0) {
      startTime.add(interval, 'minutes');
    }
    times.push(`${startTime.get('hours')}:${startTime.get('minutes').toString().padStart(2, '0')}`);
  }

  return times;
};

const lookupTable = (intervals, days) => days.map(day => intervals.map(time => ({ day: `Day ${day}`, time })));

const gridTimes = intervals => intervals.map((time, index) =>
  ({ static: true, x: 0, y: index + 1, w: 1, h: 1, time, i: uuid.v4() }));

const range = total => Array.from(Array(total)).map((noop, i) => i + 1);

// Add interval, which can be specific to start say, 1, 5, 15, 30, 1hour
// build matrix of days and times for quick look up when moving and expanding
// [1,1] = Sunday at 6:00
// [1,2] = Sunday at 6:05
export default class Planner extends PureComponent {
  static propTypes = {
    // for now Sunday = 0, Saturday = 6
    days: PropTypes.oneOfType([PropTypes.number]).isRequired,
    end: PropTypes.number,
    interval: PropTypes.oneOf(INTERVALS),
    // for now it will be an array of plans
    // the index should correspond to the days to start
    plans: PropTypes.arrayOf(
      PropTypes.shape({
        // should be optional at some point
        id: PropTypes.string,
        // for now this needs to corresponds to days, 0 - 6
        day: PropTypes.number,
        // for now time corresponds to the index of the interval.
        // TODO: Convert this to physical time and build from there
        time: PropTypes.number,
        label: PropTypes.string
      })
    ),
    start: PropTypes.number
  }

  static defaultProps = {
    interval: '5m',
    start: 6,
    end: 24
  };

  constructor(props) {
    super(props);

    invariant(props.end >= props.start, 'End time cannot be less than or equal to start time');
    invariant(!Number.isNaN(props.days), 'Days must be a number or a date range.');
    invariant(props.days > 0, 'Days must be greater than one.');
    // get the time interval
    const interval = new RegExp(intervalMatch, 'g').exec(props.interval)[1];
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
        x: plan.day,
        y: plan.time + 1,
        w: 1,
        h: 1,
        label: `${dayTime.day}: ${dayTime.time} - ${toTime.time}`,
        i: plan.id
      };
    });

    this.state = {
      // use for quick lookup
      planIds: props.plans.map(plan => plan.id),
      gDaysOfWeek,
      gTimes,
      gPlans,
      lookup,
      days,
      intervals
    };
  }

  componentDidMount() {
    // Get the width and height of a single box at the time
    // to use that to calculate rough grids
    const grid = findDOMNode(this.grid).getBoundingClientRect(); // eslint-disable-line react/no-find-dom-node
    // console.log(window.pageXOffset, window.pageYOffset, window.pageYOffset + grid.top, window.pageXOffset + grid.left);
    const element = findDOMNode(this.spacer).getBoundingClientRect(); // eslint-disable-line react/no-find-dom-node
    // grab the width and height to be able to calculate click positions
    const { width, height } = element;

    this.setState({ // eslint-disable-line react/no-did-mount-set-state
      coordinates: {
        grid: {
          x: window.pageXOffset + grid.left,
          y: window.pageYOffset + grid.top
        },
        width: Math.round(width),
        height: Math.round(height)
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.interval !== nextProps.interval) {
      const interval = new RegExp(intervalMatch, 'g').exec(nextProps.interval)[1];
      // this will build all time intervals per day, this will get used for future lookups
      const intervals = calculateIntervals(parseInt(interval, 10), nextProps.start, nextProps.end);

      // construct the lookup table, this will be an array of arrays to fast look up data about
      // the cross section of day and time.  [day][time]
      const lookup = lookupTable(intervals, this.state.days);

      // times for the view
      const gTimes = gridTimes(intervals);

      this.setState({
        gTimes,
        intervals,
        lookup
      });
    }
  }

  getGrid(event) {
    const { coordinates } = this.state;
    // where the user clicked, minus the top left corner of the grid
    const xWithin = event.pageX - coordinates.grid.x;
    const yWithin = event.pageY - coordinates.grid.y;
    // this should give us the rough location of the click within the grid
    // adding 10 to account for the transformation margin between grid points
    const y = Math.floor(yWithin / (coordinates.height + 10));
    const x = Math.floor(xWithin / (coordinates.width + 10));

    return { x, y };
  }

  isValidMove(plan) {
    const { lookup } = this.state;
    if (typeof lookup[plan.x] === 'undefined') {
      return false;
    }

    if (typeof lookup[plan.x][plan.y] === 'undefined') {
      return false;
    }

    return true;
  }

  handleLayoutChange = layout => {
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

  handleAddPlan = event => {
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

  handleRemovePlan = id => {
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

  handleSelectPlan = id => {
    console.log(id);
  }

  render() {
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
          isOpen
        >
          Test
        </Modal>
      </div>
    );
  }
}
