import { expect } from 'chai';
import 'mocha';
import * as Types from '../../src/types';
import { createLookupTables, gridPlans, range } from '../../src/utils/planner';

describe('utils - planner', () => {
  describe('range', () => {
    it('should return a valid range of dates with a start and end', () => {
      const output = range('02/01/2018', '02/10/2018');

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

    it('should return a valid range of dates with a start and days', () => {
      const output = range('02/01/2018', 9);

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

  describe('createLookupTables', () => {
    it('should return the lookup table', () => {
      const days = [
        '02/01/2018',
        '02/02/2018',
        '02/03/2018'
      ];
      const intervals = ['6:30', '7:00'];
      const output = createLookupTables(days, intervals);

      // gives us something to look up by date
      expect(output.byDate).to.deep.equal({
        '02/01/2018': 0,
        '02/02/2018': 1,
        '02/03/2018': 2
      });

      // this will allow us to then look up information for the grid
      expect(output.grid).to.deep.equal([
        [{ time: '6:30', day: 'Day 02/01/2018' }, { time: '7:00', day: 'Day 02/01/2018' }],
        [{ time: '6:30', day: 'Day 02/02/2018' }, { time: '7:00', day: 'Day 02/02/2018' }],
        [{ time: '6:30', day: 'Day 02/03/2018' }, { time: '7:00', day: 'Day 02/03/2018' }]
      ]);
    });
  });

  describe('gridPlans', () => {
    it('should return the plans in grid form', () => {
      const plans = [
        { id: '1', date: '02/01/2018', time: 0, label: 'Fun' },
        { id: '2', date: '02/02/2018', time: 0, label: 'Fun' },
        { id: '3', date: '02/03/2018', time: 0, label: 'Fun' }
      ];
      const days = [
        '02/01/2018',
        '02/02/2018',
        '02/03/2018'
      ];
      const intervals = ['6:30', '7:00'];

      const lookup = createLookupTables(days, intervals);

      const output = gridPlans(plans, lookup);

      expect(output).to.deep.equal([{
        h: 1,
        i: '1',
        label: 'Day 02/01/2018: 6:30 - 7:00',
        w: 1,
        x: 0,
        y: 1,
        minW: 1,
        maxW: 1
      }, {
        h: 1,
        i: '2',
        label: 'Day 02/02/2018: 6:30 - 7:00',
        w: 1,
        x: 1,
        y: 1,
        minW: 1,
        maxW: 1
      }, {
        h: 1,
        i: '3',
        label: 'Day 02/03/2018: 6:30 - 7:00',
        w: 1,
        x: 2,
        y: 1,
        minW: 1,
        maxW: 1
      }]);
    });
  });
});
