/* global window document */
import React from 'react';
import ReactDOM from 'react-dom';
import Planner from '../src/Planner.js';

const days = [
  { label: 'Sunday', plans: [{ label: 'Fun' }, { label: 'Fun' }, { label: 'Fun' }] },
  { label: 'Monday', plans: [{ label: 'Fun' }, { label: 'Fun' }, { label: 'Fun' }] },
  { label: 'Tuesday', plans: [{ label: 'Fun' }, { label: 'Fun' }, { label: 'Fun' }] }
];

ReactDOM.render(
  <div><Planner days={days} /></div>
, document.getElementById('app'));
