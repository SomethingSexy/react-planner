import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
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
    plans: PropTypes.arrayOf(
      PropTypes.shape({
        schedule: PropTypes.arrayOf(
          PropTypes.shape({
            label: PropTypes.string
          })
        )
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
    // the cross section of day and time.  Day will be the first array and time will be the second
    const lookup = props.days.map(day => {
      return intervals.map(time => ({ day: DAYS[day], time }));
    });

    // take days an convert them to columns, which would be X.
    // take the schedule and that would b y
    const plans = props.plans.reduce((grids, day, index) => {
      if (day.schedule) {
        return grids.concat(day.schedule.map((item, itemIndex) => {
          const dayTime = lookup[index][itemIndex];
          return { x: index + 1, y: itemIndex, w: 1, h: 1, label: `${dayTime.day} - ${dayTime.time}`, key: uuid.v4() };
        }));
      }

      return grids;
    }, []);

    // times for the view
    const gTimes = intervals.map((time, index) => ({ static: true, x: 0, y: index + 1, w: 1, h: 1, label: time }));

    // days for the view
    const gDaysOfWeek = props.days.map(day =>
      ({ x: day + 1, y: 0, w: 1, h: 1, static: true, label: DAYS[day], key: uuid.v4() }));

    this.state = {
      gDaysOfWeek,
      gTimes,
      plans,
      lookup
    };
  }

  handleChangeTime = (layout, oldItem, newItem) => {
    console.log(oldItem, newItem);
    // the grid [0][0] is empty, [0][1] is a label
    // subtracting 1 will get us to the correct position in the lookup
    console.log(this.state.lookup[newItem.x - 1][(newItem.y - 1) + (newItem.h - 1)]);
  }

  render() {
    const { days } = this.props;
    const { gDaysOfWeek, gTimes, plans } = this.state;

    return (
      <ReactGridLayout
        className="layout"
        cols={days.length + 1}
        rowHeight={30}
        verticalCompact={false}
        width={1200}
        // use this to determine if we are increase or decreasing time
        onResizeStop={this.handleChangeTime}
      >
        {gTimes.map(time => <div data-grid={time} key={time.label}>{time.label}</div>)}
        {gDaysOfWeek.map(day => <div data-grid={day} key={day.label}>{day.label}</div>)}
        {plans.map(plan => <div data-grid={plan} key={plan.key}><small>{plan.label}</small></div>)}
      </ReactGridLayout>
    );
  }
}
