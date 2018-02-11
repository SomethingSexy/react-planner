import PropTypes from 'prop-types';
import React, { StatelessComponent } from 'react';
import * as Types from './types';

export interface IPlan {
  plan: Types.IGridPlan;
  onRemovePlan: (id: string) => void;
  onSelectPlan: (id: string) => void;
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
