/* global window document */
import Chip from 'material-ui/Chip'; // tslint:disable-line
import Grid from 'material-ui/Grid'; // tslint:disable-line
import { MuiThemeProvider } from 'material-ui/styles'; // tslint:disable-line
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import uuid from 'uuid';
import Planner from '../src/Planner';
import PropsForm from './PropsForm';

const plans = [
  { id: uuid.v4(), day: 1, time: 0, label: 'Fun' },
  { id: uuid.v4(), day: 2, time: 0, label: 'Fun' },
  { id: uuid.v4(), day: 3, time: 0, label: 'Fun' }
];

interface IDemo {

}

interface IDemoState {
  [name: string]: string;
  interval: string;
  days: number;
  showForm: boolean;
}

class App extends PureComponent<IDemo, IDemoState> {
  constructor(props: IDemo) {
    super(props);
    this.state = {
      days: 7,
      interval: '30m',
      showForm: false
    };
  }

  public render() {
    const { days, interval, showForm } = this.state;
    return (
      <Grid container xs={8} justify="center">
        <Grid item style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }} xs={10}>
          <Chip
            label={`${days} Days`}
            style={{ marginRight: '10px' }}
            onClick={this.handleToggleForm}
          />
          <Chip label={interval} onClick={this.handleToggleForm} />
        </Grid>
        {showForm && 
          <Grid item xs={10}>
            <PropsForm config={this.state} onChange={this.handleChange} />
          </Grid>
        }
        <Grid item xs={12}>
          <Planner days={days} interval={interval} plans={plans} />
        </Grid>
      </Grid>
    );
  }

  private handleChange = (name: string, value: string) => {
    this.setState({ [name]: value });
  }

  private handleToggleForm = () => {
    this.setState({ showForm: !this.state.showForm });
  }
}

ReactDOM.render(
  <MuiThemeProvider>
    <App />
  </MuiThemeProvider>
, document.getElementById('app'));
