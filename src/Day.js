import React from 'react';
import PropTypes from 'prop-types';

const Day = ({ day }) => {
  const label = `Day ${day}`;
  return <div><strong>{label}</strong></div>;
};

Day.propTypes = {
  day: PropTypes.number
};

export default Day;
