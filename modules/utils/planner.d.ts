import * as Types from '../types';
export declare const calculateIntervals: (interval: number, start: number, end: number) => string[];
export declare const lookupTable: (intervals: string[], days: number[]) => {
    day: string;
    time: string;
}[][];
export declare const gridTimes: (intervals: string[]) => Types.IGridTime[];
export declare const range: (total: number) => number[];
export declare const gridDays: (days: number[]) => Types.IGridDay[];
export declare const gridPlans: (plans: Types.IPlan[], lookup: {
    day: string;
    time: string;
}[][]) => Types.IGridPlan[];
