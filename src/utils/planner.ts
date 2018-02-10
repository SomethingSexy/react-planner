import moment from 'moment';
import uuid from 'uuid';
import * as Types from '../types';

const MINUTES = 60;

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

export const gridTimes = (intervals: string[]): object[] =>
  intervals.map((time, index) =>
    ({ time, static: true, x: 0, y: index + 1, w: 1, h: 1, i: uuid.v4() }));

export const range = (total: number): number[] => Array.from(Array(total)).map((_noop, i) => i + 1);
