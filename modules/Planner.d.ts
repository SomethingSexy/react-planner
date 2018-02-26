/// <reference types="react" />
import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import * as Types from './types';
export interface IPlanner {
    dateEnd?: string;
    dateStart?: string;
    days?: number;
    end?: number;
    interval: string;
    plans: Types.IPlan[];
    start?: number;
}
export interface IPlannerState {
    days: number[];
    gDaysOfWeek: Types.IGridDay[];
    gPlans: Types.IGridPlan[];
    gTimes: Types.IGridTime[];
    intervals: string[];
    lookup: Types.lookUpTable;
    planIds: string[];
    selectedPlan: Types.IPlan | null;
}
export default class Planner extends PureComponent<IPlanner, IPlannerState> {
    static propTypes: {
        dateStart: PropTypes.Requireable<any>;
        dateEnd: PropTypes.Requireable<any>;
        days: PropTypes.Validator<any>;
        end: PropTypes.Requireable<any>;
        interval: PropTypes.Requireable<any>;
        plans: PropTypes.Requireable<any>;
        start: PropTypes.Requireable<any>;
    };
    static defaultProps: Partial<IPlanner>;
    private grid;
    private spacer;
    private coordinates;
    constructor(props: IPlanner);
    componentDidMount(): void;
    componentWillReceiveProps(nextProps: IPlanner): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
    private renderTimes();
    private renderDays();
    private renderPlans();
    private getGrid(event);
    private isValidMove(plan);
    private handleCloseModal;
    private handleLayoutChange;
    private handleAddPlan;
    private handleRemovePlan;
    private handleSelectPlan;
}
