import PropTypes from 'prop-types';
import React, { StatelessComponent } from 'react';

export interface IDay { day: string; }

const Day: StatelessComponent<IDay> = ({ day }) => {
  const label = day;
  return <div><strong>{label}</strong></div>;
};

Day.propTypes = {
  day: PropTypes.string
};

export default Day;
