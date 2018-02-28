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

/**
 * 
 * @param days
 * @param intervals
 */
export const createLookupTables = (days: string[], intervals: string[]): Types.ILookup  => {
  return {
    byDate: days.reduce((ret, day, index) => ({ ...ret, [day]: index }), {}),
    grid: days.map(day => intervals.map(time => ({ time, day: `Day ${day}` })))
  };
};

export const gridTimes = (intervals: string[]): Types.IGridTime[] =>
  intervals.map((time, index) =>
    ({ time, static: true, x: 0, y: index + 1, w: 1, h: 1, i: uuid.v4() }));

/**
 * Returns a filled array of numbers (as a string type) given the total.
 * @param total
 */
export const range = (startDate: string, endDate: string | number | undefined): string[] => {
  const start = moment(startDate, validDates);
  const end = typeof endDate === 'string'
    ? moment(endDate, validDates)
    : moment(startDate, validDates).add(endDate, 'days');

  const difference = end.diff(start, 'days');

  const filledDates = [start.format('MM/DD/YYYY')];
  for (let i = 0; i < difference; i += 1) {
    filledDates.push(start.add(1, 'days').format('MM/DD/YYYY'));
  }

  return filledDates;
};

export const gridDays = (days: string[]): Types.IGridDay[] =>
  days.map((day, index) => ({ day, x: index + 1, y: 0, w: 1, h: 1, static: true, key: uuid.v4() }));

export const gridPlans = (plans: Types.IPlan[], lookup: Types.ILookup): Types.IGridPlan[] =>
  plans.map(plan => {
    const dateIndex = lookup.byDate[plan.date];
    const dayTime = lookup.grid[dateIndex][plan.time];
    const toTime = lookup.grid[dateIndex][plan.time + 1];
    return {
      h: 1,
      i: plan.id,
      label: `${dayTime.day}: ${dayTime.time} - ${toTime.time}`,
      w: 1,
      x: dateIndex,
      y: plan.time + 1,
      minW: 1,
      maxW: 1
    };
  });
