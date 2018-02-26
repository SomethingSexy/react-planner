import * as Types from '../types';
export declare const calculateIntervals: (interval: number, start: number, end: number) => string[];
/**
 * Creates a lookup table for dates to times.
 * @param intervals - all available time intervals
 * @param days - range of dates
 */
export declare const lookupTable: (intervals: string[], days: number[]) => {
    day: string;
    time: string;
}[][];
/**
 * Creates a lookup table for converting range into grid indexes.
 * @param range
 */
export declare const lookupByDates: (days: string[]) => {
    [key: string]: [number];
};
export declare const gridTimes: (intervals: string[]) => Types.IGridTime[];
/**
 * Returns a filled array of numbers (as a string type) given the total.
 * @param total
 */
export declare const range: (total: number) => number[];
export declare const gridDays: (days: number[]) => Types.IGridDay[];
export declare const gridPlans: (plans: Types.IPlan[], lookup: {
    day: string;
    time: string;
}[][]) => Types.IGridPlan[];
/**
 * Given a set of plans, return the range of dates within those plans.
 * @param plans
 */
export declare const rangeDates: (plans: Types.IPlan[]) => string[];
