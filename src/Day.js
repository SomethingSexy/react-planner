import React from 'react';
import PropTypes from 'prop-types';
import { DAYS } from './constants.js';

const Day = ({ day }) => {
  const label = DAYS[day];
  return <div><strong>{label}</strong></div>;
};

Day.propTypes = {
  day: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6])
};

export default Day;
