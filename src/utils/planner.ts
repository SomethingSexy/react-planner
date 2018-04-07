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
    grid: days.map(day => intervals.map(time => ({ time, day })))
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

export const gridPlans =
  (plans: Types.IPlan[], lookup: Types.ILookup)
  : Types.IGridPlan[] =>
    plans.map(plan => {
      const dateIndex = lookup.byDate[plan.date];
      // const dayTime = lookup.grid[dateIndex][plan.time];
      // const toTime = lookup.grid[dateIndex][plan.toTime];

      const height = plan.toTime - plan.time;

      return {
        h: height || 1,
        i: plan.id,
        // time: `${dayTime.time} - ${toTime.time}`,
        w: 1,
        x: dateIndex + 1,
        y: plan.time + 1,
        minW: 1,
        maxW: 1
      };
    });

export const getPlansByDate = (plans: Types.IPlan[], date: string) =>
  plans
    .filter(plan => plan.date === date)
    .sort((a, b) => a.time - b.time);

const collided = (y: number, interval: number, plans: Types.IPlan[]) =>
  !!plans.find(plan => {
    // need to check if the plan crosses any other plan.
    // if they start at the same time
    if (plan.time === (y - 1)) {
      return true;
    }
    // now check if the end time of the new plan will cross over
    // to an existing plan
    return (y + interval) > plan.time && (y + interval) <= plan.toTime;
  });

export const isValidTime = (x: number, y: number, lookup: Types.ILookup) => {
  return !!lookup.grid[x][y];
};

/**
 * @param {number} x - x coordinate of the plan we want to add, 1 is the start.
 * @param {number} y - y coordinate of the plan we want to add, 1 is the start.
 * @param {number} number - count of time ranges for this plan.
 * @param {ILookup} lookup
 * @param {IPlan[]} plans
 *
 * @returns {object|boolean} - false if it cannot add or information about how to add
 */
export const canAdd =
  (x: number, y: number, interval: number, lookup: Types.ILookup, plans: Types.IPlan[]) => {
    const dateLookup = x - 1;
    const stateTimeLookup = y - 1;
    const toTimeLookup = y + interval;
    const start = lookup.grid[dateLookup][stateTimeLookup];
    let to = lookup.grid[dateLookup][toTimeLookup];

    if (!isValidTime(dateLookup, stateTimeLookup, lookup)
      || !isValidTime(dateLookup, toTimeLookup, lookup)) {
      return false;
    }

    const date = lookup.grid[dateLookup][stateTimeLookup];
    // grab the plans for this date, sorted by time
    const datePlans = getPlansByDate(plans, date.day);

    // check if this would collide with another plan
    let collision = collided(y, interval, datePlans);

    if (!collision) {
      return { start, to, toTime: toTimeLookup, startTime: stateTimeLookup };
    }

    // if we still cannot add but the interval is 0, then return false
    if (interval === 0) {
      return false;
    }

    // if we can't add, see if lowering the interval would allow it to add
    // lower to fit until we cannot anymore
    let intCheck = interval;
    while (intCheck >= 0 && collision) {
      intCheck = intCheck - 1;
      collision = collided(y, intCheck, datePlans);
    }

    if (collision) {
      return false;
    }

    to = lookup.grid[dateLookup][y + intCheck];
    return { start, to, toTime: y + intCheck, startTime: stateTimeLookup };
  };
