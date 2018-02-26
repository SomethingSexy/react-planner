/// <reference types="react" />
import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import * as Types from './types';
export interface IEditPlan {
    plan: Types.IPlan;
}
declare class EditPlan extends PureComponent<IEditPlan> {
    static propTypes: {
        plan: PropTypes.Requireable<any>;
    };
    render(): JSX.Element;
}
export default EditPlan;
