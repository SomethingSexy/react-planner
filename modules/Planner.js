/* global window, document */
import invariant from 'invariant';
import * as moment from 'moment';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { findDOMNode } from 'react-dom';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css'; // tslint:disable-line
import Modal from 'react-modal';
import 'react-resizable/css/styles.css'; // tslint:disable-line
import uuid from 'uuid';
import { INTERVALS } from './constants.js';
import Day from './Day.js';
import EditPlan from './EditPlan.js';
import Plan from './Plan.js';
import Time from './Time.js';
import elementFromPoint from './utils/elementFromPoint.js';
import { calculateIntervals, gridDays, gridPlans, gridTimes, lookupTable, range, rangeDates } from './utils/planner';
const WidthReactGridLayout = WidthProvider(ReactGridLayout);
// const validIntervals = [1, 5, 15, 30, 60];
const intervalMatch = /(\d+)(m|h)+/;
const spacer = { x: 0, y: 0, w: 1, h: 1, static: true };
// Add interval, which can be specific to start say, 1, 5, 15, 30, 1hour
// build matrix of days and times for quick look up when moving and expanding
// [1,1] = Sunday at 6:00
// [1,2] = Sunday at 6:05
export default class Planner extends PureComponent {
    constructor(props) {
        super(props);
        this.coordinates = null;
        this.handleCloseModal = () => {
            this.setState({ selectedPlan: null });
        };
        this.handleLayoutChange = (layout) => {
            const { gPlans, lookup, planIds } = this.state;
            // grab the plans
            const nextPlans = layout.filter((item) => planIds.indexOf(item.i) !== -1);
            // compare the next plans with the currently visible plans, saving off any
            // that we know of changed
            const changed = nextPlans.filter((nextPlan) => {
                const plan = gPlans.find(gPlan => gPlan.i === nextPlan.i);
                // start with moving
                if (plan && (plan.x !== nextPlan.x || plan.y !== nextPlan.y || plan.h !== nextPlan.h)) {
                    return true;
                }
                return false;
            });
            // if something has changed, then lets update the grid plans
            if (changed.length) {
                const updatedgPlans = gPlans.map(plan => {
                    const nextPlan = changed.find((c) => c.i === plan.i);
                    if (nextPlan && this.isValidMove(nextPlan)) {
                        const dayTime = lookup[nextPlan.x - 1][nextPlan.y - 1];
                        const toTime = lookup[nextPlan.x - 1][(nextPlan.y - 1) + (nextPlan.h - 1) + 1];
                        return Object.assign({}, plan, { h: nextPlan.h, label: `${dayTime.day}: ${dayTime.time} - ${toTime.time}`, x: nextPlan.x, y: nextPlan.y });
                    }
                    return Object.assign({}, plan);
                });
                this.setState({ gPlans: updatedgPlans });
            }
        };
        this.handleAddPlan = (event) => {
            const currentClick = elementFromPoint(event.clientX, event.clientY);
            // not a grid item
            if (currentClick.classList.contains('react-grid-layout')) {
                const { gPlans, lookup, planIds } = this.state;
                const { x, y } = this.getGrid(event);
                const dayTime = lookup[x - 1][y - 1];
                const toTime = lookup[x - 1][(y - 1) + 1];
                const id = uuid.v4();
                // TODO: need to formally add this to plans
                this.setState({
                    gPlans: [
                        ...gPlans, {
                            x,
                            y,
                            h: 1,
                            i: id,
                            label: `${dayTime.day}: ${dayTime.time} - ${toTime.time}`,
                            w: 1
                        }
                    ],
                    planIds: [...planIds, id]
                });
            }
        };
        this.handleRemovePlan = (id) => {
            const index = this.state.gPlans.findIndex(plan => plan.i === id);
            if (index === 0) {
                this.setState({
                    gPlans: this.state.gPlans.slice(index + 1)
                });
            }
            else {
                this.setState({
                    gPlans: [
                        ...this.state.gPlans.slice(0, index),
                        ...this.state.gPlans.slice(index + 1)
                    ]
                });
            }
        };
        this.handleSelectPlan = (id) => {
            const { plans } = this.props;
            const selectedPlan = plans.find(plan => plan.id === id);
            this.setState({ selectedPlan: selectedPlan || null });
        };
        const { days, end = 24, interval = '5m', start = 6, plans = [], dateStart, dateEnd } = props;
        // Days or dates can be passed, in the case of days, they just enter in the days
        // they want to plan for but no actual dates have been set.  If there is a date range
        // then that is the first/last.  If none are passed in then we can extract them from
        // the plans.
        invariant(plans.length || days || (dateStart && dateEnd), 'Plans, days, or start dates are required.');
        if (days) {
            invariant(!Number.isNaN(days), 'Days must be a number or a date range.');
            invariant(days > 0, 'Days must be greater than one.');
        }
        if (dateStart && dateEnd) {
            invariant(moment(dateStart, 'MM-DD-YYYY', true).isValid, 'Start date must be valid.');
            invariant(moment(dateEnd, 'MM-DD-YYYY', true).isValid, 'End date must be valid.');
        }
        invariant(end >= start, 'End time cannot be less than or equal to start time');
        // get the time interval
        const regInterval = new RegExp(intervalMatch, 'g').exec(interval);
        const rawInterval = regInterval ? regInterval[1] : '5';
        // this will build all time intervals per day, this will get used for future lookups
        const intervals = calculateIntervals(parseInt(rawInterval, 10), start, end);
        let rangeDays = [];
        if (plans.length) {
            const dates = rangeDates(plans);
            rangeDays = range(dates.length);
        }
        else if (days) {
            rangeDays = range(days);
        }
        else {
            // assume start/end dates
        }
        // construct the lookup table, this will be an array of arrays to fast look up data about
        // the cross section of day and time.  [day][time]
        // TODO: We need this to be keyed by index so it can easily work with the grid
        const lookup = lookupTable(intervals, rangeDays);
        // times for the view
        const gTimes = gridTimes(intervals);
        // days for the view, unfortunately with the way RGL works we need to add this to direct child
        const gDaysOfWeek = gridDays(rangeDays);
        // given the plans, create the data necessary for the view
        const gPlans = gridPlans(props.plans, lookup);
        this.state = {
            gDaysOfWeek,
            gPlans,
            gTimes,
            intervals,
            lookup,
            days: rangeDays,
            // use for quick lookup
            planIds: props.plans.map(plan => plan.id),
            selectedPlan: null
        };
    }
    componentDidMount() {
        // Get the width and height of a single box at the time
        // to use that to calculate rough grids
        const grid = findDOMNode(this.grid).getBoundingClientRect();
        // tslint:disable-next-line
        // console.log(window.pageXOffset, window.pageYOffset, window.pageYOffset + grid.top, window.pageXOffset + grid.left);
        const element = findDOMNode(this.spacer).getBoundingClientRect();
        // grab the width and height to be able to calculate click positions
        const { width, height } = element;
        this.coordinates = {
            grid: {
                x: window.pageXOffset + grid.left,
                y: window.pageYOffset + grid.top
            },
            height: Math.round(height),
            width: Math.round(width)
        };
        document.addEventListener('keydown', this.handleCloseModal);
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.interval !== nextProps.interval || this.props.days !== nextProps.days) {
            const regInterval = new RegExp(intervalMatch, 'g').exec(nextProps.interval);
            const interval = regInterval ? regInterval[1] : '5';
            // this will build all time intervals per day, this will get used for future lookups
            const intervals = calculateIntervals(parseInt(interval, 10), nextProps.start || 6, nextProps.end || 24);
            const days = range(nextProps.days || 6);
            const gDaysOfWeek = days.map(day => ({ day, x: day, y: 0, w: 1, h: 1, static: true, key: uuid.v4() }));
            // construct the lookup table, this will be an array of arrays to fast look up data about
            // the cross section of day and time.  [day][time]
            const lookup = lookupTable(intervals, days);
            // times for the view
            const gTimes = gridTimes(intervals);
            this.setState({
                days,
                gDaysOfWeek,
                gTimes,
                intervals,
                lookup
            });
        }
    }
    componentDidUpdate() {
        // Get the width and height of a single box at the time
        // to use that to calculate rough grids
        const grid = findDOMNode(this.grid).getBoundingClientRect();
        // tslint:disable-next-line
        // console.log(window.pageXOffset, window.pageYOffset, window.pageYOffset + grid.top, window.pageXOffset + grid.left);
        const element = findDOMNode(this.spacer).getBoundingClientRect();
        // grab the width and height to be able to calculate click positions
        const { width, height } = element;
        this.coordinates = {
            grid: {
                x: window.pageXOffset + grid.left,
                y: window.pageYOffset + grid.top
            },
            height: Math.round(height),
            width: Math.round(width),
        };
    }
    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleCloseModal);
    }
    render() {
        const { gPlans, days, selectedPlan } = this.state;
        // Setting it up this way because d.ts is not correct for rgl
        const rglProps = {
            className: 'layout',
            cols: days.length + 1,
            layout: gPlans,
            onLayoutChange: this.handleLayoutChange,
            ref: (ref) => { this.grid = ref; },
            rowHeight: 30,
            compactType: null
        };
        return (React.createElement("div", null,
            React.createElement("div", { onDoubleClick: this.handleAddPlan },
                React.createElement(WidthReactGridLayout, Object.assign({}, rglProps),
                    React.createElement("div", { "data-grid": spacer, key: "spacer", ref: ref => { this.spacer = ref; } }),
                    this.renderTimes(),
                    this.renderDays(),
                    this.renderPlans())),
            React.createElement(Modal, { contentLabel: "Edit Plan", isOpen: !!selectedPlan }, selectedPlan && React.createElement(EditPlan, { plan: selectedPlan }))));
    }
    renderTimes() {
        const { gTimes } = this.state;
        return gTimes.map(time => React.createElement("div", { "data-grid": time, key: time.i },
            React.createElement(Time, { time: time.time })));
    }
    renderDays() {
        const { gDaysOfWeek } = this.state;
        return gDaysOfWeek.map(day => React.createElement("div", { "data-grid": day, key: day.key },
            React.createElement(Day, { day: day.day })));
    }
    renderPlans() {
        const { gPlans } = this.state;
        return gPlans.map(plan => (React.createElement("div", { key: plan.i, style: { border: '1px solid #eee' } },
            React.createElement(Plan, { plan: plan, onRemovePlan: this.handleRemovePlan, onSelectPlan: this.handleSelectPlan }))));
    }
    getGrid(event) {
        const coordinates = this.coordinates;
        if (!coordinates) {
            // TODO: figure out what this should be
            return { x: 0, y: 0 };
        }
        // where the user clicked, minus the top left corner of the grid
        const xWithin = event.pageX - coordinates.grid.x;
        const yWithin = event.pageY - coordinates.grid.y;
        // this should give us the rough location of the click within the grid
        // adding 10 to account for the transformation margin between grid points
        const y = Math.floor(yWithin / (coordinates.height + 10));
        const x = Math.floor(xWithin / (coordinates.width + 10));
        return { x, y };
    }
    isValidMove(plan) {
        const { lookup } = this.state;
        if (typeof lookup[plan.x] === 'undefined') {
            return false;
        }
        if (typeof lookup[plan.x][plan.y] === 'undefined') {
            return false;
        }
        return true;
    }
}
Planner.propTypes = {
    // for now Sunday = 0, Saturday = 6
    dateStart: PropTypes.string,
    dateEnd: PropTypes.string,
    days: PropTypes.oneOfType([PropTypes.number]).isRequired,
    end: PropTypes.number,
    interval: PropTypes.oneOf(INTERVALS),
    // for now it will be an array of plans
    // the index should correspond to the days to start
    plans: PropTypes.arrayOf(PropTypes.shape({
        // for now this needs to corresponds to days, 0 - 6
        date: PropTypes.number,
        // should be optional at some point
        id: PropTypes.string,
        label: PropTypes.string,
        // for now time corresponds to the index of the interval.
        // TODO: Convert this to physical time and build from there
        time: PropTypes.number
    })),
    start: PropTypes.number
};
Planner.defaultProps = {
    end: 24,
    interval: '5m',
    plans: [],
    start: 6
};
//# sourceMappingURL=Planner.js.map