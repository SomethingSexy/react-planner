/* global window document */
import React from 'react';
import ReactDOM from 'react-dom';
import Planner from '../src/Planner.js';

const days = [
  { label: 'Sunday', schedule: [{ label: 'Fun' }, { label: 'Fun' }, { label: 'Fun' }] },
  { label: 'Monday', schedule: [{ label: 'Fun' }, { label: 'Fun' }, { label: 'Fun' }] },
  { label: 'Tuesday', schedule: [{ label: 'Fun' }, { label: 'Fun' }, { label: 'Fun' }] }
];

ReactDOM.render(
  <div><Planner days={days} /></div>
, document.getElementById('app'));
