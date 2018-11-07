/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import sinon from 'sinon';

describe('alerting service', async () => {
  const { alerting } = require('./');
  test('should create a legacy plugin for use', async () => {
    const myKibana = { Plugin: () => ({}) };
    const mock = sinon.mock(myKibana);

    mock.expects('Plugin').once();
    expect(typeof alerting).toEqual('function');
    const alertingInstance = alerting(myKibana);

    mock.verify();
  });
});
