import { uniq } from 'lodash';
import * as moment from 'moment';
import uuid from 'uuid';
import { DOWN, LEFT, RIGHT, UP } from '../constants';
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

/**
 * @deprecated
 * @param intervals
 */
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

/**
 * @deprecated
 * @param days
 */
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

const collided = (y: number, h: number, plans: Types.IPlan[]) =>
  !!plans.find(plan => {
    // need to check if the plan crosses any other plan.
    // if they start at the same time
    if (plan.time === y) {
      return true;
    }
    // now check if the end time of the new plan will cross over
    // to an existing plan
    // return (y > plan.time && y < plan.toTime) || (plan.time < y && plan.toTime > h);
    return (plan.time > y && plan.toTime < h) // checks if larger going over smaller
      || (y > plan.time && y < plan.toTime); // checks if smaller going into larger
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
    const dateLookup = x;
    const stateTimeLookup = y;
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
    if (interval === 1) {
      return false;
    }

    // if we can't add, see if lowering the interval would allow it to add
    // lower to fit until we cannot anymore
    let intCheck = interval;
    while (intCheck >= 1 && collision) {
      intCheck = intCheck - 1;
      collision = collided(y, intCheck, datePlans);
    }

    if (collision) {
      return false;
    }

    to = lookup.grid[dateLookup][y + intCheck];
    return { start, to, toTime: y + intCheck, startTime: stateTimeLookup };
  };

export const canMove = (
  id: string, x: number, y: number, h: number, lookup: Types.ILookup, plans: Types.IPlan[]
) => {
  const dateLookup = x;
  const stateTimeLookup = y;
  const toTimeLookup = h;

  if (!isValidTime(dateLookup, stateTimeLookup, lookup)
    || !isValidTime(dateLookup, toTimeLookup, lookup)) {
    return false;
  }

  const date = lookup.grid[dateLookup][stateTimeLookup];
  // grab the plans for this date, sorted by time, filter out the plan we are moving
  const datePlans = getPlansByDate(plans, date.day).filter(plan => plan.id !== id);

  // check if this would collide with another plan
  const collision = collided(y, y + h, datePlans);
  return !collision;
};

export const getClosestPlan = (id: string, plans: Types.IPlan[], direction?: string) => {
  const planToMove = plans.find(plan => plan.id === id);
  if (planToMove && (direction === UP || direction === DOWN)) {
    // find the highlighted plan
    // find all of the plans with the same date
    // find the plan previous
    const times = getPlansByDate(plans, planToMove.date);
    const toMoveIndex = times.findIndex(plan => plan.id === planToMove.id);
    const moveTo = times[direction === UP ? toMoveIndex - 1 : toMoveIndex + 1];

    if (moveTo) {
      return moveTo.id;
      // this.setState({ highlightedPlan: moveTo.id });
    }
  } else if (planToMove && (direction === RIGHT || direction === LEFT)) {
    // for left and right we need to get next and prev column
    const dates = uniq(
      plans
        .map(plan => plan.date)
        .sort((a, b) => {
          if (a < b) {
            return -1;
          }

          if (b < a) {
            return 1;
          }

          return 0;
        })
      );

    const toMoveIndex = dates.indexOf(planToMove.date);
    const moveToDate = dates[direction === LEFT ? toMoveIndex - 1 : toMoveIndex + 1];

    if (moveToDate) {
      // now find the time we should move to
      const sorted = getPlansByDate(plans, moveToDate);
      const sameTime = sorted.find(plan => plan.time === planToMove.time);
      const moveTo = sameTime ? sameTime : sorted[0];

      if (moveTo) {
        return moveTo.id;
        // this.setState({ highlightedPlan: moveTo.id });
      }
    }
  }
};
