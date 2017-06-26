import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import uuid from 'uuid';
import moment from 'moment';
import _find from 'lodash/find.js';

const hours = 24;
const startHours = 6;
const endsHours = 24;

const interval = 5; // in minutes for now
// moment.duration(2, 'minutes');
const intervals = (60 / interval) * (24 - startHours);

const times = [];
let startTime = moment.duration(startHours, 'hours');

for (let x = 0; x < intervals; x++) {
  if (startTime.get('minutes') + interval === 60) {
    startTime = moment.duration(startTime.get('hours') + 1, 'hours');
    // startTime.add(interval, 'minutes');
  } else if (x !== 0) {
    startTime.add(interval, 'minutes');
  }

  times.push({ static: true, x: 0, y: x + 1, w: 1, h: 1, label: `${startTime.get('hours')}:${startTime.get('minutes')}` });
}

// Add interval, which can be specific to start say, 1, 5, 15, 30, 1hour
export default class Planner extends PureComponent {
  static propTypes = {
    days: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        schedule: PropTypes.arrayOf(
          PropTypes.shape({
            label: PropTypes.string
          })
        )
      })
    ).isRequired
  }

  constructor(props) {
    super(props);

    // take days an convert them to columns, which would be X.
    // take the schedule and that would b y
    this.planner = props.days.reduce((grids, day, index) => {
      grids.push({ x: index + 1, y: 0, w: 1, h: 1, static: true, label: day.label, key: uuid.v4() });
      if (day.schedule) {
        return grids.concat(day.schedule.map((item, itemIndex) =>
          ({ x: index + 1, y: itemIndex, w: 1, h: 1, label: item.label, key: uuid.v4() })
        ));
      }

      return grids;
    }, []);
  }

  render() {
    const { days } = this.props;

    return (
      <ReactGridLayout
        className="layout"
        cols={days.length + 1}
        rowHeight={30}
        verticalCompact={false}
        width={1200}
        // use this to determine if we are increase or decreasing time
        onResizeStop={(layout, oldItem, newItem) => console.log(oldItem, newItem)}
      >
        {times.map(time => <div data-grid={time} key={time.label}>{time.label}</div>)}
        {this.planner.map(plan => <div data-grid={plan} key={plan.key}>{plan.label}</div>)}
      </ReactGridLayout>
    );
  }
}
