import moment from 'moment';
import PropTypes from 'prop-types';
import React, { StatelessComponent } from 'react';

export interface IDay { day: string; }

/**
 * @deprecated
 * @param param0
 */
const Day: StatelessComponent<IDay> = ({ day }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <strong>{moment(day, 'MM/DD/YYYY').format('MM/DD')}</strong>
    </div>
  );
};

Day.propTypes = {
  day: PropTypes.string
};

export default Day;
