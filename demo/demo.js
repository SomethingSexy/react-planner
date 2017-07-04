/* global window document */
import React from 'react';
import ReactDOM from 'react-dom';
import Planner from '../src/Planner.js';

const plans = [
  { schedule: [{ label: 'Fun' }, { label: 'Fun' }, { label: 'Fun' }] },
  { schedule: [{ label: 'Fun' }, { label: 'Fun' }, { label: 'Fun' }] },
  { schedule: [{ label: 'Fun' }, { label: 'Fun' }, { label: 'Fun' }] }
];

const days = [0, 1, 2, 3, 4, 5, 6];

ReactDOM.render(
  <div><Planner days={days} plans={plans} /></div>
, document.getElementById('app'));
