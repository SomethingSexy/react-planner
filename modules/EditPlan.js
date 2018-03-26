import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
class EditPlan extends PureComponent {
    render() {
        const { onEditPlan, render, plan } = this.props;
        return (React.createElement("div", null, render ? render(plan, onEditPlan) : null));
    }
}
EditPlan.propTypes = {
    children: PropTypes.func,
    plan: PropTypes.shape({ label: PropTypes.string }),
    render: PropTypes.func,
    onEditPlan: PropTypes.func
};
export default EditPlan;
//# sourceMappingURL=EditPlan.js.map