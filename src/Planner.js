import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import uuid from 'uuid';

export default class Planner extends PureComponent {
  static propTypes = {
    days: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        schedule: PropTypes.arrayOf(
          PropTypes.shape({
            label: PropTypes.string
          })
        )
      })
    ).isRequired
  }

  constructor(props) {
    super(props);

    // take days an convert them to columns, which would be X.
    // take the schedule and that would b y
    this.planner = props.days.reduce((grids, day, index) => {
      grids.push({ x: index, y: 0, w: 1, h: 1, static: true, label: day.label, key: uuid.v4() });
      if (day.schedule) {
        return grids.concat(day.schedule.map((item, itemIndex) =>
          ({ x: index, y: itemIndex, w: 1, h: 1, label: item.label, key: uuid.v4() })
        ));
      }

      return grids;
    }, []);
    console.log(this.planner);
  }

  componentDidMount() {
    // Dragula(this.dayContainers, {});
  }

  render() {
    const { days } = this.props;
    

    return (
      <ReactGridLayout className="layout" cols={days.length} rowHeight={30} width={1200} verticalCompact={false}>
        {this.planner.map(plan => {
          return <div key={plan.key} data-grid={plan}>{plan.label}</div>;
        })}
      </ReactGridLayout>
    );
    //    <div key="a" data-grid={{ x: 0, y: 0, w: 1, h: 2, minW: 1, maxW: 1 }}>a</div>
    //    <div key="b" data-grid={{ x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: 1 }}>b</div>
    //    <div key="c" data-grid={{ x: 0, y: 1, w: 1, h: 2, minW: 1, maxW: 1 }}>c</div>
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
