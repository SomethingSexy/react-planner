import PropTypes from 'prop-types';
import React, { StatelessComponent } from 'react';

export interface IDay { day: number; }

const Day: StatelessComponent<IDay> = ({ day }) => {
  const label = `Day ${day}`;
  return <div><strong>{label}</strong></div>;
};

Day.propTypes = {
  day: PropTypes.number
};

export default Day;
