import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
const Day = ({ day }) => {
    return (React.createElement("div", { style: { textAlign: 'center' } },
        React.createElement("strong", null, moment(day, 'MM/DD/YYYY').format('MM/DD'))));
};
Day.propTypes = {
    day: PropTypes.string
};
export default Day;
//# sourceMappingURL=Day.js.map