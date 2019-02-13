/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { savedObjectsMixin } from './saved_objects_mixin';
import sinon from 'sinon';

describe('Saved Objects Mixin', () => {
  let mockKbnServer;
  let mockServer;
  const mockCallCluster = sinon.spy();
  const stubCallCluster = sinon.stub();
  const stubConfig = sinon.stub();

  beforeEach(() => {
    mockServer = {
      log: sinon.spy(),
      route: sinon.spy(),
      decorate: sinon.spy(),
      config: () => {
        return {
          get: stubConfig,
        };
      },
      plugins: {
        elasticsearch: {
          getCluster: () => {
            return {
              callWithRequest: mockCallCluster,
              callWithInternalUser: stubCallCluster,
            };
          },
          waitUntilReady: sinon.spy(),
        },
      },
    };
    mockKbnServer = {
      server: mockServer,
      ready: () => {},
      pluginSpecs: { some: () => { return true; } },
      uiExports: {
        savedObjectSchemas: {
          hiddentype: {
            hidden: true,
          }
        },
        savedObjectMappings: [
          {
            pluginId: 'testtype',
            properties: {
              testtype: {
                properties: {
                  name: { type: 'keyword' },
                },
              },
            },
          },
          {
            pluginId: 'secretPlugin',
            properties: {
              hiddentype: {
                properties: {
                  secret: { type: 'keyword' },
                },
              },
            },
          },
        ],
      },
    };
  });

  describe('no kibana plugin', () => {
    it('should not try to create anything', () => {
      mockKbnServer.pluginSpecs.some = () => false;
      savedObjectsMixin(mockKbnServer, mockServer);
      mockServer.log.calledWithMatch(sinon.match.array, sinon.match.string);
    });
  });

  describe('Routes', () => {
    it('should create 7 routes', () => {
      savedObjectsMixin(mockKbnServer, mockServer);
      expect(mockServer.route.callCount).toBe(7);
    });
    it('should add POST /api/saved_objects/_bulk_create', () => {
      savedObjectsMixin(mockKbnServer, mockServer);
      expect(mockServer.route.calledWithMatch(sinon.match({ path: '/api/saved_objects/_bulk_create', method: 'POST' }))).toBeTruthy();
    });
    it('should add POST /api/saved_objects/_bulk_get', () => {
      savedObjectsMixin(mockKbnServer, mockServer);
      expect(mockServer.route.calledWithMatch(sinon.match({ path: '/api/saved_objects/_bulk_get', method: 'POST' }))).toBeTruthy();
    });
    it('should add POST /api/saved_objects/{type}/{id?}', () => {
      savedObjectsMixin(mockKbnServer, mockServer);
      expect(mockServer.route.calledWithMatch(sinon.match({ path: '/api/saved_objects/{type}/{id?}', method: 'POST' }))).toBeTruthy();
    });
    it('should add DELETE /api/saved_objects/{type}/{id}', () => {
      savedObjectsMixin(mockKbnServer, mockServer);
      expect(mockServer.route.calledWithMatch(sinon.match({ path: '/api/saved_objects/{type}/{id}', method: 'DELETE' }))).toBeTruthy();
    });
    it('should add GET /api/saved_objects/_find', () => {
      savedObjectsMixin(mockKbnServer, mockServer);
      expect(mockServer.route.calledWithMatch(sinon.match({ path: '/api/saved_objects/_find', method: 'GET' }))).toBeTruthy();
    });
    it('should add GET /api/saved_objects/{type}/{id}', () => {
      savedObjectsMixin(mockKbnServer, mockServer);
      expect(mockServer.route.calledWithMatch(sinon.match({ path: '/api/saved_objects/{type}/{id}', method: 'GET' }))).toBeTruthy();
    });
    it('should add PUT /api/saved_objects/{type}/{id}', () => {
      savedObjectsMixin(mockKbnServer, mockServer);
      expect(mockServer.route.calledWithMatch(sinon.match({ path: '/api/saved_objects/{type}/{id}', method: 'PUT' }))).toBeTruthy();
    });
  });

  describe('Saved object service', () => {
    let service;

    beforeEach(() => {
      savedObjectsMixin(mockKbnServer, mockServer);
      for(let n = 0; n < mockServer.decorate.callCount; ++n) {
        const decorateCall = mockServer.decorate.getCall(n);
        if(decorateCall.calledWithMatch('server', 'savedObjects', sinon.match({}))) {
          service = decorateCall.args[2];
          break;
        }
      }
    });

    it('should return all types', () => {
      expect(service).toBeDefined();
      expect(service.types).toEqual(['config', 'testtype']);
    });

    const mockCallEs = sinon.spy();
    describe('repository creation', () => {
      it('should not allow a repository with an undefined type', () => {
        expect(() => {
          service.getSavedObjectsRepository(mockCallEs, ['extraType']);
        }).toThrow(new Error('Missing mappings for saved objects type \'extraType\''));
      });

      it('should create a repository without hidden types', () => {
        const repository = service.getSavedObjectsRepository(mockCallEs);
        expect(repository).toBeDefined();
        expect(repository._allowedTypes).toEqual(['config', 'testtype']);
      });

      it('should create a repository with a unique list of allowed types', () => {
        const repository = service.getSavedObjectsRepository(mockCallEs, ['config', 'config', 'config']);
        expect(repository._allowedTypes).toEqual(['config', 'testtype']);
      });

      it('should create a repository with extraTypes minus duplicate', () => {
        const repository = service.getSavedObjectsRepository(mockCallEs, ['hiddentype', 'hiddentype']);
        expect(repository._allowedTypes).toEqual(['config', 'testtype', 'hiddentype']);
      });

      it('should not allow a repository without a callCluster function', () => {
        expect(() => {
          service.getSavedObjectsRepository({});
        }).toThrow(new Error('Repository requires a "callCluster" function to be provided.'));
      });
    });

    describe('get client', () => {
      it('should return a valid client object', () => {
        const client = service.getScopedSavedObjectsClient();
        expect(client).toBeDefined();
      });

      it('should have a method to set the client factory', () => {
        expect(service).toHaveProperty('setScopedSavedObjectsClientFactory');
      });

      it('should have a method to add a client wrapper factory', () => {
        expect(service).toHaveProperty('addScopedSavedObjectsClientWrapperFactory');
      });

      it('should allow you to set a scoped saved objects client factory', () => {
        expect(() => {
          service.setScopedSavedObjectsClientFactory({});
        }).not.toThrowError();
      });

      it('should allow you to add a scoped saved objects client wrapper factory', () => {
        expect(() => {
          service.addScopedSavedObjectsClientWrapperFactory({});
        }).not.toThrowError();
      });

      it('should call underlining callCluster', async () => {
        stubCallCluster.withArgs('indices.get').returns({ status: 404 });
        stubCallCluster.withArgs('indices.getAlias').returns({ status: 404 });
        stubCallCluster.withArgs('cat.templates').returns([]);
        stubConfig.withArgs('kibana.index').returns('kibana-index');
        const client = await service.getScopedSavedObjectsClient();
        await client.create('testtype');
        expect(stubCallCluster.calledWithMatch('create', sinon.match.object)).toBeTruthy();
      });
    });

    describe('#getSavedObjectsClient', () => {
      let getSavedObjectsClient;

      beforeEach(() => {
        savedObjectsMixin(mockKbnServer, mockServer);
        for(let n = 0; n < mockServer.decorate.callCount; ++n) {
          const decorateCall = mockServer.decorate.getCall(n);
          if(decorateCall.calledWithMatch('request', 'getSavedObjectsClient', sinon.match.func)) {
            getSavedObjectsClient = decorateCall.args[2];
            break;
          }
        }
      });

      it('should be callable', () => {
        mockServer.savedObjects = service;
        getSavedObjectsClient = getSavedObjectsClient.bind({});
        expect(() => {
          getSavedObjectsClient();
        }).not.toThrowError();
      });

      it('should use cached request object', () => {
        mockServer.savedObjects = service;
        getSavedObjectsClient = getSavedObjectsClient.bind({ _test: 'me' });
        const savedObjectsClient = getSavedObjectsClient();
        expect(getSavedObjectsClient()).toEqual(savedObjectsClient);
      });
    });
  });
});
