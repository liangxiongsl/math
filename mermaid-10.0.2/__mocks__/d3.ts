// @ts-nocheck TODO: Fix TS
import { MockedD3 } from '../packages/mermaid/src/tests/MockedD3';

export const select = function () {
  return new MockedD3();
};

export const selectAll = function () {
  return new MockedD3();
};

export const curveBasis = 'basis';
export const curveLinear = 'linear';
export const curveCardinal = 'cardinal';
