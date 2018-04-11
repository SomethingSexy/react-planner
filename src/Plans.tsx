import React, { Component } from 'react';
import * as Types from './types';

export interface IProps {
  plans: Types.IPlan[];
}

export default class Plans extends Component<IProps> {

  public render() {
    return (
      <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Score</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Ryu</td>
                <td>10000</td>
            </tr>
            <tr className="is-selected">
                <td>Ken</td>
                <td>5000</td>
            </tr>
            <tr>
                <td>Akuma</td>
                <td>1200</td>
            </tr>
        </tbody>
      </table>
    );
  }
}
