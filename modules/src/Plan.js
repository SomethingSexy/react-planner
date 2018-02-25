import PropTypes from 'prop-types';
import React from 'react';
const Plan = ({ plan, onRemovePlan, onSelectPlan }) => {
    return (React.createElement("div", { style: { height: '100%', width: '100%' }, onDoubleClick: onSelectPlan.bind(onSelectPlan, plan.i) },
        React.createElement("small", null,
            plan.label,
            " ",
            React.createElement("a", { onClick: onRemovePlan.bind(onRemovePlan, plan.i) }, "Remove"))));
};
Plan.propTypes = {
    onRemovePlan: PropTypes.func,
    onSelectPlan: PropTypes.func,
    plan: PropTypes.shape({ label: PropTypes.string })
};
export default Plan;
//# sourceMappingURL=Plan.js.map