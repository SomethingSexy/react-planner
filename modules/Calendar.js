import invariant from 'invariant';
import * as moment from 'moment';
import React, { Component } from 'react';
import CalendarItem from './components/CalendarPlan';
import { calculateIntervals, createLookupTables, range } from './utils/planner';
const intervalMatch = /(\d+)(m|h)+/;
class Calendar extends Component {
    constructor(props) {
        super(props);
        this.handleUpdatePlan = (id, x, y, w, h) => {
            console.log(id, x, y, w, h); // tslint:disable-line
            console.log(this.state.grid[x][y]); // tslint:disable-line
            const updatedPlans = this.state.plans.map((plan) => {
                if (plan.id !== id) {
                    return plan;
                }
                return Object.assign({}, plan, { h,
                    w });
            });
            this.setState({ plans: updatedPlans });
        };
        const { days, end = 24, dateStart, dateEnd, interval = '5m', start = 6 } = props;
        // TODO: Update this so the dateState is required but endDate can be optional or
        // dervied from days.  Plans will only have dates.
        invariant(days || dateEnd, 'Days, or end date is required.');
        invariant(moment(dateStart, 'MM-DD-YYYY').isValid(), 'Start date must be valid.');
        if (days) {
            invariant(!Number.isNaN(days), 'Days must be a number or a date range.');
            invariant(days > 0, 'Days must be greater than one.');
        }
        if (dateEnd) {
            invariant(moment(dateEnd, 'MM-DD-YYYY').isValid(), 'End date must be valid.');
        }
        invariant(end >= start, 'End time cannot be less than or equal to start time');
        // get the time interval
        const regInterval = new RegExp(intervalMatch, 'g').exec(interval);
        const rawInterval = regInterval ? regInterval[1] : '5';
        // this will build all time intervals per day, this will get used for future lookups
        const intervals = calculateIntervals(parseInt(rawInterval, 10), start, end);
        const rangeDays = range(dateStart, dateEnd || days);
        const { byDate, grid } = createLookupTables(rangeDays, intervals);
        this.state = {
            byDate,
            grid,
            intervals,
            cols: rangeDays.length,
            days: rangeDays,
            plans: [{
                    id: '1',
                    x: 0,
                    y: 0,
                    w: 1,
                    h: 1
                }]
        };
    }
    render() {
        // TODO: width height should be based off columns, etc
        const { cols } = this.state;
        const width = cols * 50;
        return (React.createElement("div", null,
            this.renderDays(),
            this.renderTimes(),
            React.createElement("div", { style: { position: 'relative', height: '500px', width: `${width}px`, left: '50px' } }, this.renderPlans())));
    }
    renderDays() {
        const { days } = this.state;
        const offset = 50;
        const renderedDays = days.map((day, index) => {
            return (React.createElement("div", { key: day, style: { left: `${index * 50}px`, width: '50px', display: 'inline-block' } },
                React.createElement("p", { style: { textOverflow: 'ellipsis', overflow: 'hidden' } }, day)));
        });
        return (React.createElement("div", { style: { position: 'relative', left: `${offset}px` } }, renderedDays));
    }
    renderTimes() {
        const { intervals } = this.state;
        const offset = 50;
        const renderedIntervals = intervals.map((interval, index) => {
            return (React.createElement("div", { key: interval, style: { top: `${index * 50 + offset}px`, height: '50px', width: '50px', float: 'left' } },
                React.createElement("p", { style: { textOverflow: 'ellipsis', overflow: 'hidden' } }, interval)));
        });
        return (React.createElement("div", { style: { width: '50px' } }, renderedIntervals));
    }
    renderPlans() {
        // TODO: type here
        const { cols } = this.state;
        return this.state.plans.map((plan) => {
            return (React.createElement(CalendarItem, { cols: cols, h: plan.h, id: plan.id, key: plan.id, onUpdate: this.handleUpdatePlan, x: plan.x, w: plan.w, y: plan.y }));
        });
    }
}
export default Calendar;
//# sourceMappingURL=Calendar.js.map