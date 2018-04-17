import PropTypes from 'prop-types';
import React from 'react';
const style = {
    height: '100%',
    width: '100%',
    backgroundColor: 'white',
    textAlign: 'center',
    color: 'inherit',
    cursor: 'pointer'
};
/**
 * @deprecated
 * @param param0
 */
const Plan = ({ plan, highlightedPlan, onSelectPlan, onOpenPlan, render }) => {
    let localStyle = style;
    if (plan.id === highlightedPlan) {
        localStyle = Object.assign({}, localStyle, { backgroundColor: 'hsl(204, 86%, 53%)', color: 'white' });
    }
    return (React.createElement("div", { style: localStyle, onClick: onSelectPlan.bind(onSelectPlan, plan.id), onDoubleClick: onOpenPlan.bind(onOpenPlan, plan.id) }, render ? render(plan, { expanded: plan.toTime - plan.time > 1 }) : null));
};
Plan.propTypes = {
    onRemovePlan: PropTypes.func,
    onSelectPlan: PropTypes.func,
    plan: PropTypes.shape({ label: PropTypes.string }),
    render: PropTypes.func
};
export default Plan;
//# sourceMappingURL=Plan.js.map