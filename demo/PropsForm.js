import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { LabelRadio, RadioGroup } from 'material-ui/Radio';
import { FormLabel, FormControl } from 'material-ui/Form';
import { INTERVALS } from '../src/constants.js';

class PropsForm extends PureComponent {
  static propTypes = {
    config: PropTypes.shape({
      interval: PropTypes.oneOf(INTERVALS)
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
    const { interval } = this.props.config;
    return (
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
    );
  }
}

export default PropsForm;
