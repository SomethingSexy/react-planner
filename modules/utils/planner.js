import * as moment from 'moment';
import uuid from 'uuid';
const MINUTES = 60;
// TODO: worry about locale here
const validDates = ['MM-DD-YYYY', 'YYYY-MM-DD'];
export const calculateIntervals = (interval, start, end) => {
    const intervals = (MINUTES / interval) * (end - start);
    const times = [];
    let startTime = moment.duration(start, 'hours');
    for (let x = 0; x < intervals; x++) {
        if (startTime.get('minutes') + interval === 60) {
            startTime = moment.duration(startTime.get('hours') + 1, 'hours');
        }
        else if (x !== 0) {
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
export const createLookupTables = (days, intervals) => {
    return {
        byDate: days.reduce((ret, day, index) => (Object.assign({}, ret, { [day]: index })), {}),
        grid: days.map(day => intervals.map(time => ({ time, day })))
    };
};
export const gridTimes = (intervals) => intervals.map((time, index) => ({ time, static: true, x: 0, y: index + 1, w: 1, h: 1, i: uuid.v4() }));
/**
 * Returns a filled array of numbers (as a string type) given the total.
 * @param total
 */
export const range = (startDate, endDate) => {
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
export const gridDays = (days) => days.map((day, index) => ({ day, x: index + 1, y: 0, w: 1, h: 1, static: true, key: uuid.v4() }));
export const gridPlans = (plans, lookup) => plans.map(plan => {
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
export const getPlansByDate = (plans, date) => plans
    .filter(plan => plan.date === date)
    .sort((a, b) => a.time - b.time);
/**
 * @param {number} x - x coordinate of the plan we want to add, 1 is the start.
 * @param {number} y - y coordinate of the plan we want to add, 1 is the start.
 * @param {number} number - count of time ranges for this plan.
 */
export const canAdd = (x, y, interval, lookup, plans) => {
    const toTime = y + interval;
    const start = lookup.grid[x - 1][y - 1];
    const to = lookup.grid[x - 1][toTime];
    if (!start || !to) {
        return false;
    }
    // grab the plans for this date, sorted by time
    const datePlans = getPlansByDate(plans, start.day);
    const collision = datePlans.find(plan => {
        // need to check if the plan crosses any other plan.
        // if they start at the same time
        if (plan.time === (y - 1)) {
            return true;
        }
        // now check if the end time of the new plan will cross over
        // to an existing plan
        return toTime > plan.time && toTime <= plan.toTime;
    });
    // check if this would collide with another plan, if so lower the interval to fit
    // in the available space
    return !collision;
};
//# sourceMappingURL=planner.js.map