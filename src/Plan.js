import React from 'react';
import PropTypes from 'prop-types';

const Plan = ({ plan, onRemovePlan, onSelectPlan }) => {
  return (
    <div style={{ height: '100%', width: '100%' }} onDoubleClick={() => onSelectPlan(plan.i)}>
      <small>{plan.label} <a onClick={() => onRemovePlan(plan.i)}>Remove</a></small>
    </div>
  );
};

Plan.propTypes = {
  plan: PropTypes.shape({ label: PropTypes.string }),
  onRemovePlan: PropTypes.func,
  onSelectPlan: PropTypes.func
};

export default Plan;
