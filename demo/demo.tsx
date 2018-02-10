/* global window document */
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import uuid from 'uuid';
import { MuiThemeProvider } from 'material-ui/styles';
import Grid from 'material-ui/Grid';
import Chip from 'material-ui/Chip';
import PropsForm from './PropsForm.tsx';
import Planner from '../src/Planner.tsx';

const plans = [
  { id: uuid.v4(), day: 1, time: 0, label: 'Fun' },
  { id: uuid.v4(), day: 2, time: 0, label: 'Fun' },
  { id: uuid.v4(), day: 3, time: 0, label: 'Fun' }
];

class App extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      interval: '30m',
      days: 7
    };
  }

  handleChange = (name, value) => {
    this.setState({ [name]: value });
  }

  handleToggleForm = () => {
    this.setState({ showForm: !this.state.showForm });
  }

  render() {
    const { days, interval, showForm } = this.state;
    return (
      <Grid container gutter={8} justify="center">
        <Grid item style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }} xs={10}>
          <Chip label={`${days} Days`} style={{ marginRight: '10px' }} onClick={this.handleToggleForm} />
          <Chip label={interval} onClick={this.handleToggleForm} />
        </Grid>
        {showForm && <Grid item xs={10}><PropsForm config={this.state} onChange={this.handleChange} /></Grid>}
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
