import PropTypes from 'prop-types';
import React, { StatelessComponent } from 'react';
import * as Types from '../types';

export interface IPlan {
  highlightedPlan: string | null | undefined;
  plan: Types.IPlan;
  onOpenPlan: (id: string) => void;
  onRemovePlan: (id: string) => void;
  onSelectPlan: (id: string) => void;
  render?: Types.RenderPlan;
}

const style = {
  height: '100%',
  width: '100%',
  backgroundColor: 'white',
  // textAlign: 'center',
  color: 'inherit',
  cursor: 'pointer'
};

/**
 * @deprecated
 * @param param0
 */
const Plan: StatelessComponent<IPlan>
  = ({ plan, highlightedPlan, onSelectPlan, onOpenPlan, render }) => {
    let localStyle = style;
    if (plan.id === highlightedPlan) {
      localStyle = {
        ...localStyle,
        backgroundColor: 'hsl(204, 86%, 53%)', // TODO: make customizable
        color: 'white'
      };
    }

    return (
      <div
        style={localStyle}
        onClick={onSelectPlan.bind(onSelectPlan, plan.id)}
        onDoubleClick={onOpenPlan.bind(onOpenPlan, plan.id)}
      >
        {render ? render(plan, { expanded: plan.toTime - plan.time > 1 }) : null}
      </div>
    );
  };

Plan.propTypes = {
  onRemovePlan: PropTypes.func,
  onSelectPlan: PropTypes.func,
  plan: PropTypes.shape({ label: PropTypes.string }),
  render: PropTypes.func
};

export default Plan;
