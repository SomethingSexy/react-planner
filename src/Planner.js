import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Dragula from 'react-dragula';

export default class Planner extends PureComponent {
  static propTypes = {
    days: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string
      })
    ).isRequired
  }

  constructor(props) {
    super(props);
    this.dayContainers = [];
  }

  componentDidMount() {
    Dragula(this.dayContainers, {});
  }

  render() {
    const { days } = this.props;
    return (
      <div>
        {days.map(day => {
          return (
            <div className="container" ref={container => { this.dayContainers.push(container); }}>
              <div>Swap me around</div>
              <div>Swap her around</div>
              <div>Swap him around</div>
              <div>Swap them around</div>
              <div>Swap us around</div>
              <div>Swap things around</div>
              <div>Swap everything around</div>
            </div>
          );
        })}
      </div>
    );
  }
}
