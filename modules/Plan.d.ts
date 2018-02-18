/// <reference types="react" />
import { StatelessComponent } from 'react';
import * as Types from './types';
export interface IPlan {
    plan: Types.IGridPlan;
    onRemovePlan: (id: string) => void;
    onSelectPlan: (id: string) => void;
}
declare const Plan: StatelessComponent<IPlan>;
export default Plan;
