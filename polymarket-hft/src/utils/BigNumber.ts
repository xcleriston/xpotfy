/**
 * Compatibility layer for BigNumber between ethers v5 and v6
 * This provides a unified interface for working with large numbers
 */

// Import from ethers v5 (which has BigNumber)
import { BigNumber as EthersBigNumber } from 'ethers';

// Re-export as BigNumber for compatibility
export { EthersBigNumber as BigNumber };

// Helper functions for BigNumber operations
export const parseUnits = (value: string, units: string = 'ether'): EthersBigNumber => {
  return EthersBigNumber.from(value).mul(EthersBigNumber.from(10).pow(18));
};

export const formatUnits = (value: EthersBigNumber, units: string = 'ether'): string => {
  return value.toString();
};

export const fromWei = (value: string | number): EthersBigNumber => {
  return EthersBigNumber.from(value);
};

export const toWei = (value: EthersBigNumber): string => {
  return value.toString();
};
