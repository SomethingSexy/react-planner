import React from 'react';
import PropTypes from 'prop-types';

const Plan = ({ plan, onRemovePlan }) => {
  return (
    <div>
      <small>{plan.label} <a onClick={() => onRemovePlan(plan.i)}>Remove</a></small>
    </div>
  );
};

Plan.propTypes = {
  plan: PropTypes.shape({ label: PropTypes.string }),
  onRemovePlan: PropTypes.func
};

export default Plan;
