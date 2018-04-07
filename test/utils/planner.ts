import { expect } from 'chai';
import 'mocha';
import * as Types from '../../src/types';
import { canAdd, createLookupTables, gridPlans, range } from '../../src/utils/planner';

describe('utils - planner', () => {
  describe('canAdd', () => {
    const days = [
      '02/01/2018',
      '02/02/2018',
      '02/03/2018'
    ];
    const intervals = ['6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00', '10:30'];
    const lookupTable = createLookupTables(days, intervals);

    it('should indicate it can add', () => {
      const plans = [];
      const output = canAdd(1, 1, 0, lookupTable, plans);
      expect(output).to.deep.equal({
        start: { time: '6:30', day: '02/01/2018' },
        to: { time: '7:00', day: '02/01/2018' },
        toTime: 1,
        startTime: 0
      });
    });

    it('should indicate it cannot add because of collision', () => {
      const plans = [
        { id: '1', date: '02/01/2018', time: 0, toTime: 1, label: 'Fun', timeRange: '' },
        { id: '2', date: '02/02/2018', time: 0, toTime: 1, label: 'Fun', timeRange: '' },
        { id: '3', date: '02/03/2018', time: 0, toTime: 1, label: 'Fun', timeRange: '' }
      ];
      // trying to add a plan to the first day
      const output = canAdd(1, 1, 0, lookupTable, plans);
      expect(output).to.equal(false);
    });

    it('should indicate it can add near edge but not crossing', () => {
      const plans = [
        { id: '1', date: '02/01/2018', time: 2, toTime: 3, label: 'Fun', timeRange: '' },
      ];
      // trying to add a plan that takes 2 time intervals but it would collide
      const output = canAdd(1, 1, 1, lookupTable, plans);
      expect(output).to.deep.equal({
        start: { time: '6:30', day: '02/01/2018' },
        to: { time: '7:30', day: '02/01/2018' },
        toTime: 2,
        startTime: 0
      });
    });

    it('should indicate it can add because it lowers the interval', () => {
      const plans = [
        { id: '1', date: '02/01/2018', time: 5, toTime: 7, label: 'Fun', timeRange: '' },
      ];
      // trying to add a plan that takes 2 time intervals but it would collide
      const output = canAdd(1, 5, 1, lookupTable, plans);
      expect(output).to.deep.equal({
        start: { time: '8:30', day: '02/01/2018' },
        to: { time: '9:00', day: '02/01/2018' },
        toTime: 5,
        startTime: 4
      });
    });

    it('should indicate it can add because of no collision', () => {
      const plans = [
        { id: '1', date: '02/01/2018', time: 0, toTime: 1, label: 'Fun', timeRange: '' },
        { id: '2', date: '02/02/2018', time: 0, toTime: 1, label: 'Fun', timeRange: '' },
        { id: '3', date: '02/03/2018', time: 0, toTime: 1, label: 'Fun', timeRange: '' }
      ];
      // trying to add a plan to the first day
      const output = canAdd(1, 2, 0, lookupTable, plans);
      expect(output).to.deep.equal({
        start: { time: '7:00', day: '02/01/2018' },
        to: { time: '7:30', day: '02/01/2018' },
        toTime: 2,
        startTime: 1
      });
    });

    it('should indicate it can add because of no collision at the edge of another', () => {
      const plans = [
        { id: '1', date: '02/01/2018', time: 2, toTime: 4, label: 'Fun', timeRange: '' }
      ];
      // trying to add a plan to the first day
      const output = canAdd(1, 1, 1, lookupTable, plans);
      expect(output).to.deep.equal({
        start: { time: '6:30', day: '02/01/2018' },
        to: { time: '7:30', day: '02/01/2018' },
        toTime: 2,
        startTime: 0
      });
    });

    it('should indicate it will add because it will fit with 0 interval', () => {
      const plans = [
        { id: '1', date: '02/01/2018', time: 1, toTime: 3, label: 'Fun', timeRange: '' },
      ];

      const output = canAdd(1, 1, 0, lookupTable, plans);

      expect(output).to.deep.equal({
        start: { time: '6:30', day: '02/01/2018' },
        to: { time: '7:00', day: '02/01/2018' },
        toTime: 1,
        startTime: 0
      });
    });

    it('should indicate it will add because it will lower the interval to fit', () => {
      const plans = [
        { id: '1', date: '02/01/2018', time: 1, toTime: 3, label: 'Fun', timeRange: '' },
      ];

      const output = canAdd(1, 1, 1, lookupTable, plans);

      expect(output).to.deep.equal({
        start: { time: '6:30', day: '02/01/2018' },
        to: { time: '7:00', day: '02/01/2018' },
        toTime: 1,
        startTime: 0
      });
    });
  });

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
        [{ time: '6:30', day: '02/01/2018' }, { time: '7:00', day: '02/01/2018' }],
        [{ time: '6:30', day: '02/02/2018' }, { time: '7:00', day: '02/02/2018' }],
        [{ time: '6:30', day: '02/03/2018' }, { time: '7:00', day: '02/03/2018' }]
      ]);
    });
  });

  describe('gridPlans', () => {
    it('should return the plans in grid form', () => {
      const plans = [
        { id: '1', date: '02/01/2018', time: 0, toTime: 1, label: 'Fun', timeRange: '' },
        { id: '2', date: '02/02/2018', time: 0, toTime: 1, label: 'Fun', timeRange: '' },
        { id: '3', date: '02/03/2018', time: 0, toTime: 1, label: 'Fun', timeRange: '' }
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
        w: 1,
        x: 1,
        y: 1,
        minW: 1,
        maxW: 1
      }, {
        h: 1,
        i: '2',
        w: 1,
        x: 2,
        y: 1,
        minW: 1,
        maxW: 1
      }, {
        h: 1,
        i: '3',
        w: 1,
        x: 3,
        y: 1,
        minW: 1,
        maxW: 1
      }]);
    });
  });
});
