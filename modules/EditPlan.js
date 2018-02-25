import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
class EditPlan extends PureComponent {
    render() {
        console.log(this.props.plan); // tslint:disable-line
        return (React.createElement("h2", null, this.props.plan.id));
    }
}
EditPlan.propTypes = {
    plan: PropTypes.shape({ label: PropTypes.string })
};
export default EditPlan;
//# sourceMappingURL=EditPlan.js.map