import { expect } from 'chai';
import 'mocha';
import * as Types from '../../src/types';
import { rangeDays } from '../../src/utils/planner';

describe('utils - planner', () => {
  describe('rangeDays', () => {
    it('should return a valid range of dates', () => {
      const plans: Types.IPlan[] = [{
        date: '2/1/2018',
        id: '',
        time: 0
      }, {
        date: '2/4/2018',
        id: '',
        time: 0
      },{
        date: '2/10/2018',
        id: '',
        time: 0
      }];
      const output = rangeDays(plans);

      expect(output).to.deep.equal([
        '02/01/2018',
        '02/02/2018',
        '02/03/2018',
        '02/04/2018',
        '02/05/2018',
        '02/06/2018',
        '02/07/2018',
        '02/08/2018',
        '02/09/2018',
        '02/10/2018'
      ]);
    });
  });
});