import PropTypes from 'prop-types';
import React from 'react';
const Plan = ({ plan, highlightedPlan, onSelectPlan, onOpenPlan }) => {
    const style = {
        height: '100%',
        width: '100%',
        backgroundColor: 'white',
        textAlign: 'center',
        color: 'inherit'
    };
    if (plan.i === highlightedPlan) {
        style.backgroundColor = 'hsl(204, 86%, 53%)'; // TODO: make customizable
        style.color = 'white';
    }
    return (React.createElement("div", { style: style, onClick: onSelectPlan.bind(onSelectPlan, plan.i), onDoubleClick: onOpenPlan.bind(onOpenPlan, plan.i) },
        React.createElement("small", null, plan.label)));
};
Plan.propTypes = {
    onRemovePlan: PropTypes.func,
    onSelectPlan: PropTypes.func,
    plan: PropTypes.shape({ label: PropTypes.string })
};
export default Plan;
//# sourceMappingURL=Plan.js.map