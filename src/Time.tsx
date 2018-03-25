import PropTypes from 'prop-types';
import React, { StatelessComponent } from 'react';

export interface ITime { time: string; }

const Time: StatelessComponent<ITime> = ({ time }) =>
  <div><strong style={{ textAlign: 'center' }}>{time}</strong></div>;

Time.propTypes = {
  time: PropTypes.string
};

export default Time;
