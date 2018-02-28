export interface ILookup {
  byDate: { [key: string]: number };
  grid: {
    day: string;
    time: string;
  }[][];
}

export interface IPlan {
  date: string; // valid date
  id: string;
  time: number;
}

export interface ICoordinates {
  height: number;
  width: number;
  grid: { x: number; y: number };
}

export interface IGridTime {
  time: string;
  static: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
}

export interface IGridDay {
  day: string;
  x: number;
  y: number;
  w: number;
  h: number;
  static: boolean;
  key: string;
}

export interface IGridPlan {
  h: number;
  i: string;
  label: string;
  minW: number;
  maxW: number;
  w: number;
  x: number;
  y: number;
}
