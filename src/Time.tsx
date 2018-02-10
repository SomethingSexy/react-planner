import React from 'react';
import PropTypes from 'prop-types';

const Time = ({ time }) => <div><strong>{time}</strong></div>;

Time.propTypes = {
  time: PropTypes.string
};

export default Time;
