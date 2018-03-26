import PropTypes from 'prop-types';
import React from 'react';
const Day = ({ day }) => {
    const label = day;
    return React.createElement("div", { style: { textAlign: 'center' } },
        React.createElement("strong", null, label));
};
Day.propTypes = {
    day: PropTypes.string
};
export default Day;
//# sourceMappingURL=Day.js.map