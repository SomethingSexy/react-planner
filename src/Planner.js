import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

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
    // Dragula(this.dayContainers, {});
  }

  render() {
    const { days } = this.props;
    return (
      <ReactGridLayout className="layout" cols={days.length} rowHeight={30} verticalCompact={false} width={1200}>
        <div key="a" data-grid={{ x: 0, y: 0, w: 1, h: 2, minW: 1, maxW: 1 }}>a</div>
        <div key="b" data-grid={{ x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: 1 }}>b</div>
        <div key="c" data-grid={{ x: 0, y: 1, w: 1, h: 2, minW: 1, maxW: 1 }}>c</div>
      </ReactGridLayout>
    );

    // return (
    //   <div>
    //     {days.map(day => {
    //       return (
    //         <div className="day" style={{ width: '200px', float: 'left' }}>
    //           <div className="header">
    //             <h6>{day.label}</h6>
    //           </div>
    //           <div className="plans" ref={container => { this.dayContainers.push(container); }}>
    //             {day.plans.map(plan => {
    //               return <div style={{ marginTop: '10px' }}>{plan.label}</div>;
    //             })}
    //           </div>
    //         </div>
    //       );
    //     })}
    //   </div>
    // );
  }
}
