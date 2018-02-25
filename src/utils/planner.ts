import * as moment from 'moment';
import uuid from 'uuid';
import * as Types from '../types';

const MINUTES = 60;
// TODO: worry about locale here
const validDates = ['MM-DD-YYYY', 'YYYY-MM-DD'];

export const calculateIntervals = (interval: number, start: number, end: number): string[] => {
  const intervals = (MINUTES / interval) * (end - start);
  const times: string[] = [];
  let startTime = moment.duration(start, 'hours');
  for (let x = 0; x < intervals; x++) { // tslint:disable-line
    if (startTime.get('minutes') + interval === 60) {
      startTime = moment.duration(startTime.get('hours') + 1, 'hours');
    } else if (x !== 0) {
      startTime.add(interval, 'minutes');
    }
    times.push(`${startTime.get('hours')}:${startTime.get('minutes').toString().padStart(2, '0')}`);
  }

  return times;
};

export const lookupTable = (intervals: string[], days: number[]): Types.lookUpTable =>
  days.map(day => intervals.map(time => ({ time, day: `Day ${day}` })));

export const gridTimes = (intervals: string[]): Types.IGridTime[] =>
  intervals.map((time, index) =>
    ({ time, static: true, x: 0, y: index + 1, w: 1, h: 1, i: uuid.v4() }));

export const range = (total: number): number[] => Array.from(Array(total)).map((_noop, i) => i + 1);

export const gridDays = (days: number[]): Types.IGridDay[] =>
  days.map(day => ({ day, x: day, y: 0, w: 1, h: 1, static: true, key: uuid.v4() }));

export const gridPlans = (plans: Types.IPlan[], lookup: Types.lookUpTable): Types.IGridPlan[] =>
  plans.map(plan => {
    const dayTime = lookup[plan.day - 1][plan.time];
    const toTime = lookup[plan.day - 1][plan.time + 1];
    return {
      h: 1,
      i: plan.id,
      label: `${dayTime.day}: ${dayTime.time} - ${toTime.time}`,
      w: 1,
      x: plan.day,
      y: plan.time + 1,
      minW: 1,
      maxW: 1
    };
  });

/**
 * Given a set of plans, return the range of dates within those plans.
 * @param plans
 */
export const rangeDays = (plans: Types.IPlan[]) => {
  const dates = plans
    .map(plan => plan.date)
    .sort((left, right) => {
      // this assumes correct dates for now
      return moment(left, validDates)
        .diff(moment(right, validDates));
    });

  // given the sort dates, grab the first and last
  if (dates.length < 2) {
    throw Error('Invalid plans.');
  }

  const first = moment(dates[0], validDates);
  const last = moment(dates[dates.length - 1], validDates);

  const difference = last.diff(first, 'days');

  const balls = [first.format('MM/DD/YYYY')];
  for (let i = 0; i < difference; i += 1) {
    balls.push(first.add(1, 'days').format('MM/DD/YYYY'));
  }

  return balls;
};
