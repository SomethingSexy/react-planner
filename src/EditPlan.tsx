import PropTypes from 'prop-types';
import { PureComponent, ReactNode } from 'react';
import * as Types from './types';

export interface IEditPlan {
  children?: Types.RenderPlanEdit;
  onEditPlan: Types.EditPlan;
  plan: Types.IPlan;
  render?: Types.RenderPlanEdit;
}

class EditPlan extends PureComponent<IEditPlan> {
  public static propTypes = {
    children: PropTypes.func,
    plan: PropTypes.shape({ label: PropTypes.string }),
    render: PropTypes.func,
    onEditPlan: PropTypes.func
  };

  public render(): ReactNode {
    const { onEditPlan, render, plan } = this.props;
    return render ? render(plan, onEditPlan) : null;
  }
}

export default EditPlan;
