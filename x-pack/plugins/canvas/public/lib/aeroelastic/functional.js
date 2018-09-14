/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

/**
 * flatten
 *
 * Flattens an array of arrays into an array
 *
 * @param {*[][]} arrays
 * @returns *[]
 */
const flatten = arrays => [].concat(...arrays);

/**
 * identity
 *
 * @param d
 * @returns d
 */
const identity = d => d;

/**
 * map
 *
 * Maps a function over an array
 *
 * Passing the index and the array are avoided
 *
 * @param {Function} fun
 * @returns {function(*): *}
 */
const map = fun => array => array.map(value => fun(value));

/**
 * log
 *
 * @param d
 * @param {Function} printerFun
 * @returns d
 */
const log = (d, printerFun = identity) => {
  console.log(printerFun(d));
  return d;
};

/**
 * disjunctiveUnion
 *
 * @param {Function} keyFun
 * @param {*[]} set1
 * @param {*[]} set2
 * @returns *[]
 */
const disjunctiveUnion = (keyFun, set1, set2) =>
  set1
    .filter(s1 => !set2.find(s2 => keyFun(s2) === keyFun(s1)))
    .concat(set2.filter(s2 => !set1.find(s1 => keyFun(s1) === keyFun(s2))));

/**
 *
 * @param {number} a
 * @param {number} b
 * @returns {number} the mean of the two parameters
 */
const mean = (a, b) => (a + b) / 2;

/**
 * unnest
 *
 * @param {*[][]} vectorOfVectors
 * @returns {*[]}
 */
const unnest = vectorOfVectors => [].concat.apply([], vectorOfVectors);

const shallowEqual = (a, b) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;

  return true;
};

module.exports = {
  disjunctiveUnion,
  flatten,
  identity,
  log,
  map,
  mean,
  shallowEqual,
  unnest,
};
