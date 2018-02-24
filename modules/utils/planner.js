import moment from 'moment';
import uuid from 'uuid';
const MINUTES = 60;
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
export const lookupTable = (intervals, days) => days.map(day => intervals.map(time => ({ time, day: `Day ${day}` })));
export const gridTimes = (intervals) => intervals.map((time, index) => ({ time, static: true, x: 0, y: index + 1, w: 1, h: 1, i: uuid.v4() }));
export const range = (total) => Array.from(Array(total)).map((_noop, i) => i + 1);
export const gridDays = (days) => days.map(day => ({ day, x: day, y: 0, w: 1, h: 1, static: true, key: uuid.v4() }));
export const gridPlans = (plans, lookup) => plans.map(plan => {
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
//# sourceMappingURL=planner.js.map