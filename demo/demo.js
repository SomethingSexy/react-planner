/* global window document */
import React from 'react';
import ReactDOM from 'react-dom';
import Planner from '../src/Planner.js';

ReactDOM.render(
  <div><Planner days={[{ label: 'Sunday' }, { label: 'Monday' }, { label: 'Tuesday' }]} /></div>
, document.getElementById('app'));
