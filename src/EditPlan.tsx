import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import * as Types from './types';

export interface IEditPlan {
  plan: Types.IPlan;
}

class EditPlan extends PureComponent<IEditPlan> {
  public static propTypes = {
    plan: PropTypes.shape({ label: PropTypes.string })
  };

  public render() {
    console.log(this.props.plan); // tslint:disable-line
    return (
      <h2>{this.props.plan.id}</h2>
    );
  }
}

export default EditPlan;
