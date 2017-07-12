import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import _find from 'lodash/find.js';
import uuid from 'uuid';
import moment from 'moment';
import invariant from 'invariant';
import { DAYS, INTERVALS } from './constants.js';
import Day from './Day.js';
import Time from './Time.js';

const WidthReactGridLayout = WidthProvider(ReactGridLayout);

const MINUTES = 60;
const validIntervals = [1, 5, 15, 30, 60];
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

const lookupTable = (intervals, days) => days.map(day => intervals.map(time => ({ day: DAYS[day], time })));

const gridTimes = intervals => intervals.map((time, index) => ({ static: true, x: 0, y: index + 1, w: 1, h: 1, time }));

// Add interval, which can be specific to start say, 1, 5, 15, 30, 1hour
// build matrix of days and times for quick look up when moving and expanding
// [1,1] = Sunday at 6:00
// [1,2] = Sunday at 6:05
export default class Planner extends PureComponent {
  static propTypes = {
    // for now Sunday = 0, Saturday = 6
    days: PropTypes.arrayOf(PropTypes.number).isRequired,
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

    // get the time interval
    const interval = new RegExp(intervalMatch, 'g').exec(props.interval)[1];
    // this will build all time intervals per day, this will get used for future lookups
    const intervals = calculateIntervals(parseInt(interval, 10), props.start, props.end);

    // construct the lookup table, this will be an array of arrays to fast look up data about
    // the cross section of day and time.  [day][time]
    const lookup = lookupTable(intervals, props.days);

    // times for the view
    const gTimes = gridTimes(intervals);

    // days for the view, unfortunately with the way RGL works we need to add this to direct child
    const gDaysOfWeek = props.days.map(day =>
      ({ day, x: day + 1, y: 0, w: 1, h: 1, static: true, key: uuid.v4() }));

    // given the plans, create the data necessary for the view
    const gPlans = props.plans.map(plan => {
      const dayTime = lookup[plan.day][plan.time];
      const toTime = lookup[plan.day][plan.time + 1];
      return {
        x: plan.day + 1,
        y: plan.time + 1,
        w: 1,
        h: 1,
        label: `${dayTime.day}: ${dayTime.time} - ${toTime.time}`,
        key: plan.id,
        i: plan.id
      };
    });

    this.state = {
      // use for quick lookup
      planIds: props.plans.map(plan => plan.id),
      gDaysOfWeek,
      gTimes,
      gPlans,
      lookup
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.interval !== nextProps.interval) {
      const interval = new RegExp(intervalMatch, 'g').exec(nextProps.interval)[1];
      // this will build all time intervals per day, this will get used for future lookups
      const intervals = calculateIntervals(parseInt(interval, 10), nextProps.start, nextProps.end);

      // construct the lookup table, this will be an array of arrays to fast look up data about
      // the cross section of day and time.  [day][time]
      const lookup = lookupTable(intervals, nextProps.days);

      // times for the view
      const gTimes = gridTimes(intervals);

      this.setState({
        gTimes,
        intervals,
        lookup
      });
    }
  }

  handleLayoutChange = layout => {
    const { gPlans, lookup, planIds } = this.state;
    // grab the plans
    const nextPlans = layout.filter(item => planIds.indexOf(item.i) !== -1);

    // compare the next plans with the currently visible plans, saving off any
    // that we know of changed
    const changed = nextPlans.filter(nextPlan => {
      const plan = _find(gPlans, { i: nextPlan.i });
      // start with moving
      if (plan.x !== nextPlan.x || plan.y !== nextPlan.y || plan.h !== nextPlan.h) {
        return true;
      }
      return false;
    });

    // if something has changed, then lets update the grid plans
    if (changed.length) {
      const updatedgPlans = gPlans.map(plan => {
        const nextPlan = _find(changed, { i: plan.i });

        if (nextPlan) {
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

        return plan;
      });
      this.setState({ gPlans: updatedgPlans });
    }
  }

  render() {
    const { days } = this.props;
    const { gDaysOfWeek, gTimes, gPlans } = this.state;

    return (
      <WidthReactGridLayout
        className="layout"
        cols={days.length + 1}
        rowHeight={30}
        verticalCompact={false}
        onLayoutChange={this.handleLayoutChange}
      >
        <div data-grid={spacer} />
        {gTimes.map(time => <div data-grid={time} key={time.time}><Time time={time.time} /></div>)}
        {gDaysOfWeek.map(day => <div data-grid={day} key={day.key}><Day day={day.day} /></div>)}
        {gPlans.map(plan => <div data-grid={plan} key={plan.key} style={{ border: '1px solid #eee' }}><small>{plan.label}</small></div>)}
      </WidthReactGridLayout>
    );
  }
}
