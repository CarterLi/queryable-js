/** For VSCode intellisense only
 * @type {GeneratorFunction}
 **/
const GeneratorBase = null;

class Queryable extends GeneratorBase {
  /**
   * @param {IterableIterator} iterable
   * @returns {Queryable}
   */
  static *from(iterable = []) {
    yield* iterable;
  }

  /** @returns {Queryable} */
  static of(...args) {
    return Queryable.from(args);
  }

  /** Generates an integer range
   * @param {number} startOrSize inclusive. evaluated as stop if param stop is not specified
   * @param {number} stop exclusive
   * @returns {Queryable}
   **/
  static *range(startOrSize, stop, step = 1) {
    if (stop === undefined) {
      stop = startOrSize;
      startOrSize = 0;
    }
    for (let item = startOrSize; item < stop; item += step) {
      yield item;
    }
  }

  static isQueryable(obj) {
    return obj && typeof obj === 'object' && obj.constructor === Queryable;
  }

  constructor(array = []) {
    return Queryable.from(array);
  }

  /**
   * @param {any[][] | any[]} items
   * @returns {Queryable}
   */
  *concat(...items) {
    yield* this;
    yield* this.flat.call(items);
  }

  /**
   * @param {function (currentValue, index: number, array: Queryable)} callback
   * @returns {Queryable}
   **/
  *map(callback) {
    let i = 0;
    for (const item of this) {
      yield callback(item, i++, this);
    }
  }

  /**
   * @param {function (currentValue, index: number, array: Queryable): boolean} callback
   * @returns {Queryable}
   **/
  *filter(callback) {
    let i = 0;
    for (const item of this) {
      if (callback(item, i++, this)) {
        yield item;
      }
    }
  }

  /** @returns {Queryable} */
  *reverse() {
    for (const item of this) {
      yield* this.reverse();
      yield item;
    }
  }

  /** @returns {Queryable} */
  *push(...items) {
    yield* this;
    yield* items;
  }

  /** @returns {Queryable} */
  *unshift(...items) {
    yield* items;
    yield* this;
  }

  /** @returns {Queryable} */
  *shift(length = 1) {
    while (length-- && !this.next().done) {}
    yield* this;
  }

  /** @returns {Queryable} */
  *pop(length = 1) {
    const queue = [];
    while (length--) {
      const { value, done } = this.next();
      if (done) return;
      queue.push(value);
    }
    while (true) {
      const { value, done } = this.next();
      if (done) return;
      queue.push(value);
      yield queue.shift();
    }
  }

  /** @returns {Queryable} */
  *slice(begin = 0, end = Infinity) {
    let iterable = this.shift(begin);
    if (end < 0) {
      yield* iterable.pop(-end);
    } else {
      end -= begin;
      while (end-- > 0) {
        const { value, done } = iterable.next();
        if (done) return;
        yield value;
      }
    }
  }

  /**
   * @param {number} start
   * @returns {Queryable}
   */
  *splice(start, deleteCount = Infinity, ...newItems) {
    yield* this.slice(0, start);
    yield* newItems;
    yield* this.shift(deleteCount);
  }

  /** @returns {Queryable} */
  *flat() { // TODO: support flatten depth
    for (const item of this) {
      Array.isArray(item) ? yield* item : yield item;
    }
  }

  /**
   * @param {function (currentValue, index: number, array: Queryable)} callback
   * @returns {Queryable}
   **/
  flatMap(callback) {
    return this.map(callback).flat();
  }

  keys() {
    return this.map((_, i) => i);
  }

  values() {
    return this;
  }

  entries() {
    return this.map((x, i) => [i, x]);
  }

  /** @param {function (currentValue, index: number, array: Queryable): boolean} callback */
  findIndex(callback) {
    let idx = 0;
    for (const item of this) {
      if (callback(item, idx++, this)) return idx;
    }
    return -1;
  }

  /** @param {function (currentValue, index: number, array: Queryable): boolean} callback */
  find(callback) {
    for (const [idx, item] of this.entries()) {
      if (callback(item, idx, this)) return item;
    }
  }

  /** @param {function (currentValue, index: number, array: Queryable): boolean} callback */
  some(callback) {
    return this.findIndex(callback) >= 0;
  }

  /** @param {function (currentValue, index: number, array: Queryable): boolean} callback */
  every(callback) {
    return !this.some((...args) => !callback(...args));
  }

  indexOf(item, startIndex = 0) {
    return this.shift(startIndex).findIndex(x => x === item);
  }

  lastIndexOf(item, startIndex = 0) {
    return this.reverse().shift(startIndex).indexOf(item);
  }

  includes(item, startIndex = 0) {
    return this.shift(startIndex).findIndex(x => Object.is(x, item)) >= 0;
  }

  /** @param {function (currentValue, index: number, array: Queryable)} callback */
  forEach(callback) {
    this.some((...args) => callback(...args) && false);
  }

  /**
   * @param {function (accumulator, currentValue, index: number, array: Queryable)} callback
   * @param initialValue
   */
  reduce(callback, initialValue = this.next().value) {
    this.forEach((...args) => initialValue = callback(initialValue, ...args));
    return initialValue;
  }

  /**
   * @param {function (accumulator, currentValue, index: number, array: Queryable)} callback
   * @param initialValue
   */
  reduceRight(callback, initialValue) {
    return this.reverse().reduce(callback, initialValue);
  }

  join(separator = ',') {
    let result = '';
    for (const item of this) {
      result += item;
      result += separator;
    }
    return result.slice(0, -1);
  }
}
[
  ...Object.getOwnPropertyNames(Queryable.prototype)
    .map(x => Queryable.prototype[x].prototype),
  ...Object.getOwnPropertyNames(Queryable)
    .map(x => Queryable[x].prototype),
]
  .filter(x => Object.prototype.toString.call(x) === '[object Generator]')
  .forEach(x => Object.defineProperties(x, Object.getOwnPropertyDescriptors(Queryable.prototype)));
