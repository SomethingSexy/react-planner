import { ReactNode } from 'react';

export interface ILookup {
  byDate: IByDate;
  grid: IGrid;
}

export type IGrid = {
  day: string;
  time: string;
}[][];

export interface IByDate { [key: string]: number; }

export interface IPlan {
  date: string; // valid date
  id: string;
  time: number;
  timeRange?: string;
  toTime: number;
  // stores dynamic plan data
  [key: string]: any;
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
  // time: string;
  minW: number;
  maxW: number;
  w: number;
  x: number;
  y: number;
}

export type RenderPlanEdit = (plan: IPlan, onEditPlan: EditPlan) => ReactNode;

export type RenderPlan = (plan: IPlan, options: { expanded: boolean; }) => ReactNode;

export type RenderModal =
  (plan: IPlan, options: {}, isOpen: boolean) => ReactNode;

export type EditPlan = (id: string, name: string, value: any) => void;

export type UpdatePlan = (id: string, x: number, y: number, w: number, h: number) => void;
