import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import _find from 'lodash/find.js';
import uuid from 'uuid';
import moment from 'moment';
import invariant from 'invariant';

const MINUTES = 60;
const validIntervals = [1, 5, 15, 30, 1];
const intervalMatch = /(\d+)(m|h)+/g;

const DAYS = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

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
    // times.push({ static: true, x: 0, y: x + 1, w: 1, h: 1, label: `${startTime.get('hours')}:${startTime.get('minutes')}` });
  }

  return times;
};
// Add interval, which can be specific to start say, 1, 5, 15, 30, 1hour
// build matrix of days and times for quick look up when moving and expanding
// [1,1] = Sunday at 6:00
// [1,2] = Sunday at 6:05
export default class Planner extends PureComponent {
  static propTypes = {
    // for now Sunday = 0, Saturday = 6
    days: PropTypes.arrayOf(PropTypes.number).isRequired,
    end: PropTypes.number,
    interval: PropTypes.oneOf(['1m', '5m', '15m', '30m', '1h']),
    // for now it will be an array of plans
    // the index should correspond to the days to start
    plans: PropTypes.arrayOf(
      PropTypes.shape({
        // should be optional at some point
        id: PropTypes.string,
        // for now this needs to corresponds to days, 0 - 6
        day: PropTypes.number,
        // for now time corresponds to the index of the time , change later
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
    const interval = intervalMatch.exec(props.interval)[1];
    // this will build all time intervals per day, this will get used for future lookups
    const intervals = calculateIntervals(parseInt(interval, 10), props.start, props.end);

    // construct the lookup table, this will be an array of arrays to fast look up data about
    // the cross section of day and time.  [day][time]
    const lookup = props.days.map(day => intervals.map(time => ({ day: DAYS[day], time })));

    // times for the view
    const gTimes = intervals.map((time, index) => ({ static: true, x: 0, y: index + 1, w: 1, h: 1, label: time }));

    // days for the view
    const gDaysOfWeek = props.days.map(day =>
      ({ x: day + 1, y: 0, w: 1, h: 1, static: true, label: DAYS[day], key: uuid.v4() }));

    // given the plans, create the data necessary for the view
    const gPlans = props.plans.map(plan => {
      const dayTime = lookup[plan.day][plan.time];
      const y = lookup[plan.day].indexOf(plan.time);
      return { x: plan.day + 1, y: y + 1, w: 1, h: 1, label: `${dayTime.day} - ${dayTime.time}`, key: plan.id, i: plan.id };
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

  handleChangeTime = (layout, oldItem, newItem) => {
    console.log(oldItem, newItem);
    // the grid [0][0] is empty, [0][1] is a label
    // subtracting 1 will get us to the correct position in the lookup
    // TODO: Find the plan that we are updating and adjust the time, (also need to readjust around it as well)
    // if increased and there is a cross section, move that one day, verse for decrease
    console.log(this.state.lookup[newItem.x - 1][(newItem.y - 1) + (newItem.h - 1)]);
  }

  handleMove = (layout, oldItem, newItem) => {
    // console.log(_find(layout, { moved: true }));
    // console.log(layout, oldItem, newItem);
    // TODO: Need to find the plan that we are moving and upate the schedule, so then we can regenerate the plans
    // need to also detect if we are moving something else
    // might need to compare the layout? https://github.com/STRML/react-grid-layout/issues/569
    // this.setState({ balls: true });
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
      if (plan.x !== nextPlan.x || plan.y !== nextPlan.y) {
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
          return {
            ...plan,
            label: `${dayTime.day} - ${dayTime.time}`,
            x: nextPlan.x,
            y: nextPlan.y
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
      <ReactGridLayout
        className="layout"
        cols={days.length + 1}
        rowHeight={30}
        verticalCompact={false}
        width={1200}
        onLayoutChange={this.handleLayoutChange}
        // use this to determine if we are increase or decreasing time
        onResizeStop={this.handleChangeTime}
        onDragStop={this.handleMove}
      >
        {gTimes.map(time => <div data-grid={time} key={time.label}>{time.label}</div>)}
        {gDaysOfWeek.map(day => <div data-grid={day} key={day.label}>{day.label}</div>)}
        {gPlans.map(plan => <div data-grid={plan} key={plan.key}><small>{plan.label}</small></div>)}
      </ReactGridLayout>
    );
  }
}
