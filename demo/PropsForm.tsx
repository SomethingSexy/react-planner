import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { LabelRadio, RadioGroup } from 'material-ui/Radio';
import { FormLabel, FormControl } from 'material-ui/Form';
import TextField from 'material-ui/TextField';
import Grid from 'material-ui/Grid';
import Paper from 'material-ui/Paper';
import { INTERVALS } from '../src/constants.js';

class PropsForm extends PureComponent {
  static propTypes = {
    config: PropTypes.shape({
      interval: PropTypes.oneOf(INTERVALS),
      days: PropTypes.number
    }),
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props);
  }

  handleChange = (event, value) => {
    this.props.onChange(event.target.name, value);
  }

  render() {
    const { interval, days } = this.props.config;
    return (
      <Paper elevation={4} style={{ padding: '10px' }}>
        <Grid container>
          <Grid item md={6}>
            <FormControl required>
              <FormLabel>Interval</FormLabel>
              <RadioGroup
                aria-label="Gender"
                name="interval"
                selectedValue={interval}
                onChange={this.handleChange}
              >
                {INTERVALS.map(i => <LabelRadio key={i} label={i} value={i} />)}
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item md={6}>
            <TextField
              id="name"
              label="Name"
              name="days"
              type="number"
              value={days}
              onChange={event => this.handleChange(event, parseInt(event.target.value, 10))}
            />
          </Grid>
        </Grid>
      </Paper>
    );
  }
}

export default PropsForm;
