import PropTypes from 'prop-types';
import React, { StatelessComponent } from 'react';

export interface ITime { time: string; }

const Time: StatelessComponent<ITime> = ({ time }) =>
  <div style={{ textAlign: 'center' }}><strong>{time}</strong></div>;

Time.propTypes = {
  time: PropTypes.string
};

export default Time;
