
export interface IPlanner {
    dateEnd?: string;
    dateStart: string;
    days?: number;
    end?: number;
    interval: string;
    onUpdatePlans: (plans: Types.IPlan[]) => {};
    plans: Types.IPlan[];
    start?: number;
}
