import invariant from 'invariant';
import * as moment from 'moment';
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { HotKeys } from 'react-hotkeys';
import Modal from 'react-modal';
import uuid from 'uuid';
import CalendarItem from './components/CalendarItem';
import EditPlan from './components/EditPlan';
import Plan from './components/Plan';
import { DOWN, LEFT, RIGHT, UP } from './constants';
import elementFromPoint from './utils/elementFromPoint.js';
import { calculateIntervals, canAdd, canMove, createLookupTables, getClosestPlan, range } from './utils/planner';
const intervalMatch = /(\d+)(m|h)+/;
const keyMap = {
    deleteNode: ['del', 'backspace'],
    moveNodeUp: [UP],
    moveNodeDown: [DOWN],
    moveNodeRight: [RIGHT],
    moveNodeLeft: [LEFT],
    openNode: ['enter']
};
// TODO: We don't want to expose w,h,x,y but convert those to meaningful
// things.  How much information do we want to leave to the rnd state
// vs control ourselves.  Or do we want to look that information up
// each time we render?
class Calendar extends Component {
    constructor(props) {
        super(props);
        this.coordinates = null;
        this.containerWidth = 100;
        this.containerHeight = 50;
        this.renderPlanEdit = (selectedPlan) => {
            const { renderPlanEdit } = this.props;
            return (React.createElement(EditPlan, { onEditPlan: this.handlePlanUpdate, plan: selectedPlan, render: renderPlanEdit }));
        };
        this.handleAddPlan = (event) => {
            const currentClick = elementFromPoint(event.clientX, event.clientY);
            // not a grid item
            if (currentClick.classList.contains('planner-layout')) {
                const { byDate, grid } = this.state;
                const { plans, onUpdatePlans } = this.props;
                const { x, y } = this.getGrid(event);
                const defaultTo = this.props.defaultPlanInterval || 1;
                const isValidAdd = canAdd(x, y, defaultTo, { byDate, grid }, plans);
                if (isValidAdd) {
                    const { start, toTime, startTime } = isValidAdd;
                    onUpdatePlans([
                        ...this.props.plans,
                        {
                            toTime,
                            id: uuid.v4(),
                            time: startTime,
                            date: start.day
                        }
                    ]);
                }
            }
        };
        this.handleMoveHighlightedPlan = (direction) => {
            const { highlightedPlan } = this.state;
            const { plans } = this.props;
            if (highlightedPlan) {
                const moveTo = getClosestPlan(highlightedPlan, plans, direction);
                if (moveTo) {
                    this.setState({ highlightedPlan: moveTo });
                }
            }
        };
        this.handleRemoveHighlightedPlan = () => {
            const { highlightedPlan } = this.state;
            if (highlightedPlan) {
                this.handleRemovePlan(highlightedPlan);
            }
        };
        /**
         * Updates a calendar item
         */
        this.handleUpdateItem = (id, x, y, w, h) => {
            const { onUpdatePlans, plans } = this.props;
            const { byDate, grid } = this.state;
            const isValidMove = canMove(id, x, y, h, { byDate, grid }, plans);
            if (isValidMove) {
                const updatedPlans = plans.map((plan) => {
                    if (plan.id !== id) {
                        return plan;
                    }
                    return Object.assign({}, plan, { w, toTime: y + h, date: this.state.grid[x][y].day, time: y });
                });
                // for now set the state, but this should get switched out for call updater func
                onUpdatePlans(updatedPlans);
            }
        };
        /**
         * Handles updating a plan with key and value.  All properties will
         * be stored at the root level.  It is up to the user to make sure
         * everything is in sync with the edit components.
         */
        this.handlePlanUpdate = (id, name, value) => {
            const { onUpdatePlans, plans } = this.props;
            const updatedPlans = plans.map(plan => {
                if (plan.id !== id) {
                    return plan;
                }
                return Object.assign({}, plan, { [name]: value });
            });
            onUpdatePlans(updatedPlans);
        };
        this.handleOpenPlan = (id) => {
            this.setState({ selectedPlan: id });
        };
        this.handleSelectPlan = (id) => {
            this.setState({ highlightedPlan: id });
        };
        this.handleCloseModal = () => {
            this.setState({ selectedPlan: null });
        };
        this.handleRemovePlan = (id) => {
            const { plans, onUpdatePlans } = this.props;
            const index = plans.findIndex(plan => plan.id === id);
            let updatedPlans;
            if (index === 0) {
                updatedPlans = plans.slice(index + 1);
            }
            else {
                updatedPlans = [
                    ...plans.slice(0, index),
                    ...plans.slice(index + 1)
                ];
            }
            onUpdatePlans(updatedPlans);
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
            selectedPlan: null,
            highlightedPlan: null
        };
        this.handlers = {
            deleteNode: this.handleRemoveHighlightedPlan,
            moveNodeUp: this.handleMoveHighlightedPlan.bind(this.handleMoveHighlightedPlan, UP),
            moveNodeDown: this.handleMoveHighlightedPlan.bind(this.handleMoveHighlightedPlan, DOWN),
            moveNodeRight: this.handleMoveHighlightedPlan.bind(this.handleMoveHighlightedPlan, RIGHT),
            moveNodeLeft: this.handleMoveHighlightedPlan.bind(this.handleMoveHighlightedPlan, LEFT)
        };
    }
    componentDidMount() {
        // Get the width and height of a single box at the time
        // to use that to calculate rough grids
        const grid = findDOMNode(this.grid).getBoundingClientRect();
        this.coordinates = {
            grid: {
                x: window.pageXOffset + grid.left,
                y: window.pageYOffset + grid.top
            },
            height: Math.round(this.containerHeight),
            width: Math.round(this.containerWidth)
        };
        document.addEventListener('keydown', (event) => {
            if (event.keyCode === 27) {
                this.handleCloseModal();
            }
        });
    }
    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleCloseModal);
    }
    render() {
        // TODO: width height should be based off columns, etc
        const { cols } = this.state;
        const offset = `${this.containerWidth}px`;
        const width = `${cols * this.containerWidth}px`;
        return (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { height: '100%' } },
                this.renderDays(),
                this.renderTimes(),
                React.createElement(HotKeys, { handlers: this.handlers, keyMap: keyMap },
                    React.createElement("div", { className: "planner-layout", onDoubleClick: this.handleAddPlan, ref: (ref) => { this.grid = ref; }, style: { width, position: 'relative', height: '500px', left: offset } }, this.renderPlans()))),
            this.renderModal()));
    }
    renderDays() {
        const { days } = this.state;
        const offset = this.containerWidth;
        const width = `${offset}px`;
        const renderedDays = days.map((day, index) => {
            return (React.createElement("div", { key: day, style: { width, left: `${index * offset}px`, display: 'inline-block' } },
                React.createElement("p", { style: { textOverflow: 'ellipsis', overflow: 'hidden' } }, day)));
        });
        return (React.createElement("div", { style: { position: 'relative', left: `${offset}px` } }, renderedDays));
    }
    renderTimes() {
        const { intervals } = this.state;
        const offset = this.containerWidth;
        const heightOffset = this.containerHeight;
        const height = `${heightOffset}px`;
        const width = `${offset}px`;
        const renderedIntervals = intervals.map((interval, index) => {
            return (React.createElement("div", { key: interval, style: { height, width, top: `${index * 25 + offset}px`, float: 'left' } },
                React.createElement("p", { style: { textOverflow: 'ellipsis', overflow: 'hidden' } }, interval)));
        });
        return (React.createElement("div", { style: { width } }, renderedIntervals));
    }
    renderPlans() {
        const { plans, renderPlan } = this.props;
        const { byDate, cols, highlightedPlan } = this.state;
        // TODO: type here
        return plans.map((plan) => {
            return (React.createElement(CalendarItem, { cols: cols, containerHeight: this.containerHeight, containerWidth: this.containerWidth, h: plan.toTime - plan.time, id: plan.id, key: plan.id, onUpdate: this.handleUpdateItem, x: byDate[plan.date], w: 1, y: plan.time },
                React.createElement(Plan, { highlightedPlan: highlightedPlan, key: plan.id, plan: plan, onOpenPlan: this.handleOpenPlan, onRemovePlan: this.handleRemovePlan, onSelectPlan: this.handleSelectPlan, render: renderPlan })));
        });
    }
    renderModal() {
        const { selectedPlan } = this.state;
        if (!selectedPlan) {
            return null;
        }
        const { renderModal, plans } = this.props;
        // TODO: not sure how I feel about this yet
        // also the checks of plan below are kind of pointless
        const plan = plans.find(p => p.id === selectedPlan);
        if (!plan) {
            return null;
        }
        if (renderModal) {
            return renderModal(plan, {
                renderPlanEdit: this.renderPlanEdit,
                onClose: this.handleCloseModal
            }, true);
        }
        return (React.createElement(Modal, { contentLabel: "Edit Plan", isOpen: true }, this.renderPlanEdit(plan)));
    }
    getGrid(event) {
        const coordinates = this.coordinates;
        if (!coordinates) {
            // TODO: figure out what this should be
            return { x: 0, y: 0 };
        }
        // TODO: come from state
        const margin = [0, 0];
        // where the user clicked, minus the top left corner of the grid
        const xWithin = event.pageX - coordinates.grid.x;
        const yWithin = event.pageY - coordinates.grid.y;
        // this should give us the rough location of the click within the grid
        // adding 10 to account for the transformation margin between grid points
        // const y = Math.floor(yWithin / (coordinates.height + 10));
        // const x = Math.floor(xWithin / (coordinates.width + 10));
        const y = Math.floor(yWithin / (coordinates.height + margin[1]));
        const x = Math.floor(xWithin / (coordinates.width + margin[0]));
        // TODO: Might make more sense to adjust the coordinates here and then
        // everything else can work on the root grid, so 1,1 would === 0,0
        // then we wouldn't need to adjust everywhere else
        return { x, y };
    }
}
export default Calendar;
//# sourceMappingURL=Calendar.js.map