/* global window document */
import React from 'react';
import ReactDOM from 'react-dom';
import uuid from 'uuid';
import Planner from '../src/Planner.js';

const plans = [
  { id: uuid.v4(), day: 0, time: 0, label: 'Fun' },
  { id: uuid.v4(), day: 1, time: 0, label: 'Fun' },
  { id: uuid.v4(), day: 2, time: 0, label: 'Fun' }
];

const days = [0, 1, 2, 3, 4, 5, 6];

ReactDOM.render(
  <div><Planner days={days} interval="30m" plans={plans} /></div>
, document.getElementById('app'));
