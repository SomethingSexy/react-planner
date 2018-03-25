import PropTypes from 'prop-types';
import React, { StatelessComponent } from 'react';
import * as Types from './types';

export interface IPlan {
  highlightedPlan: string | null | undefined;
  plan: Types.IGridPlan;
  onOpenPlan: (id: string) => void;
  onRemovePlan: (id: string) => void;
  onSelectPlan: (id: string) => void;
}

const Plan: StatelessComponent<IPlan> = ({ plan, highlightedPlan, onSelectPlan, onOpenPlan }) => {
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

  return (
    <div
      style={style}
      onClick={onSelectPlan.bind(onSelectPlan, plan.i)}
      onDoubleClick={onOpenPlan.bind(onOpenPlan, plan.i)}
    >
      <small>{plan.label}</small>
    </div>
  );
};

Plan.propTypes = {
  onRemovePlan: PropTypes.func,
  onSelectPlan: PropTypes.func,
  plan: PropTypes.shape({ label: PropTypes.string })
};

export default Plan;
