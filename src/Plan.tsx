import PropTypes from 'prop-types';
import React, { StatelessComponent } from 'react';

export interface IPlan {
  plan: { label: string, i: string};
  onRemovePlan: () => void;
  onSelectPlan: () => void;
}

const Plan: StatelessComponent<IPlan> = ({ plan, onRemovePlan, onSelectPlan }) => {
  return (
    <div
      style={{ height: '100%', width: '100%' }}
      onDoubleClick={onSelectPlan.bind(onSelectPlan, plan.i)}
    >
      <small>{plan.label} <a onClick={onRemovePlan.bind(onRemovePlan, plan.i)}>Remove</a></small>
    </div>
  );
};

Plan.propTypes = {
  onRemovePlan: PropTypes.func,
  onSelectPlan: PropTypes.func,
  plan: PropTypes.shape({ label: PropTypes.string })
};

export default Plan;
