/* global window document */
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import uuid from 'uuid';
import { MuiThemeProvider } from 'material-ui/styles';
import Grid from 'material-ui/Grid';
import PropsForm from './PropsForm.js';
import Planner from '../src/Planner.js';

const plans = [
  { id: uuid.v4(), day: 0, time: 0, label: 'Fun' },
  { id: uuid.v4(), day: 1, time: 0, label: 'Fun' },
  { id: uuid.v4(), day: 2, time: 0, label: 'Fun' }
];

const days = [0, 1, 2, 3, 4, 5, 6];

class App extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      interval: '30m'
    };
  }

  handleChange = (name, value) => {
    this.setState({ [name]: value });
  }

  render() {
    const { interval } = this.state;
    return (
      <Grid container gutter={8} justify="center">
        <Grid item xs={10}>
          <PropsForm config={this.state} onChange={this.handleChange} />
        </Grid>
        <Grid item xs={12}>
          <Planner days={days} interval={interval} plans={plans} />
        </Grid>
      </Grid>
    );
  }
}

ReactDOM.render(
  <MuiThemeProvider><App /></MuiThemeProvider>
, document.getElementById('app'));
