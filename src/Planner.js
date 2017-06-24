import React, { PureComponent } from 'react';
import Dragula from 'react-dragula';

export default class Planner extends PureComponent {

  componentDidMount() {
    Dragula([this.container1, this.container2], {});
  }

  render() {
    return (
      <div>
        <div className="container" ref={container => { this.container1 = container; }}>
          <div>Swap me around</div>
          <div>Swap her around</div>
          <div>Swap him around</div>
          <div>Swap them around</div>
          <div>Swap us around</div>
          <div>Swap things around</div>
          <div>Swap everything around</div>
        </div>
        <div className="container" ref={container => { this.container2 = container; }}>
          <div>Swap me around</div>
          <div>Swap her around</div>
          <div>Swap him around</div>
          <div>Swap them around</div>
          <div>Swap us around</div>
          <div>Swap things around</div>
          <div>Swap everything around</div>
        </div>
      </div>
    );
  }
}
