import PropTypes from 'prop-types';
import React from 'react';
const Time = ({ time }) => React.createElement("div", { style: { textAlign: 'center' } },
    React.createElement("strong", null, time));
Time.propTypes = {
    time: PropTypes.string
};
export default Time;
//# sourceMappingURL=Time.js.map