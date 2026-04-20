/**
 * Simple BigNumber implementation for compatibility
 * This provides basic BigNumber functionality without external dependencies
 */

export class SimpleBigNumber {
  private value: string;

  constructor(value: string | number = '0') {
    this.value = value.toString();
  }

  static from(value: string | number): SimpleBigNumber {
    return new SimpleBigNumber(value);
  }

  toString(): string {
    return this.value;
  }

  toNumber(): number {
    return parseFloat(this.value);
  }

  add(other: SimpleBigNumber): SimpleBigNumber {
    return new SimpleBigNumber(parseFloat(this.value) + parseFloat(other.value));
  }

  sub(other: SimpleBigNumber): SimpleBigNumber {
    return new SimpleBigNumber(parseFloat(this.value) - parseFloat(other.value));
  }

  mul(other: SimpleBigNumber): SimpleBigNumber {
    return new SimpleBigNumber(parseFloat(this.value) * parseFloat(other.value));
  }

  div(other: SimpleBigNumber): SimpleBigNumber {
    return new SimpleBigNumber(parseFloat(this.value) / parseFloat(other.value));
  }

  abs(): SimpleBigNumber {
    return new SimpleBigNumber(Math.abs(parseFloat(this.value)));
  }

  gt(other: SimpleBigNumber): boolean {
    return parseFloat(this.value) > parseFloat(other.value);
  }

  lt(other: SimpleBigNumber): boolean {
    return parseFloat(this.value) < parseFloat(other.value);
  }

  eq(other: SimpleBigNumber): boolean {
    return parseFloat(this.value) === parseFloat(other.value);
  }

  lte(other: SimpleBigNumber): boolean {
    return parseFloat(this.value) <= parseFloat(other.value);
  }

  gte(other: SimpleBigNumber): boolean {
    return parseFloat(this.value) >= parseFloat(other.value);
  }
}
