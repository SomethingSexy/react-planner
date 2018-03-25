import PropTypes from 'prop-types';
import React from 'react';
const Time = ({ time }) => React.createElement("div", null,
    React.createElement("strong", { style: { textAlign: 'center' } }, time));
Time.propTypes = {
    time: PropTypes.string
};
export default Time;
//# sourceMappingURL=Time.js.map