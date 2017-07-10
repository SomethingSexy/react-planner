import React from 'react';
import PropTypes from 'prop-types';

const Time = ({ time }) => <div><small>{time}</small></div>;

Time.propTypes = {
  time: PropTypes.string
};

export default Time;
