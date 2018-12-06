/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
// file.skip

// @ts-ignore
import { esTestConfig, kbnTestConfig, OPTIMIZE_BUNDLE_DIR } from '@kbn/test';
// @ts-ignore
import * as kbnTestServer from '../../../../../../../../src/test_utils/kbn_server';
// @ts-ignore
import { xpackKbnServerConfig } from '../../../../../../../test_utils/kbn_server_config';
import { KibanaBackendFrameworkAdapter } from './../kibana_framework_adapter';
import { contractTests } from './test_contract';
let servers: any;
contractTests('Kibana  Framework Adapter', {
  async before() {
    try {
      servers = await kbnTestServer.startTestServers({
        adjustTimeout: (t: number) => jest.setTimeout(t),
        settings: xpackKbnServerConfig,
      });
    } catch (e) {
      // tslint:disable-next-line
      console.log('kbnTestServer.startTestServers failed to start because', e);
      return process.exit(1);
    }

    // const config = legacyServer.server.config();
    // config.extendSchema(beatsPluginConfig, {}, configPrefix);

    // config.set('xpack.beats.encryptionKey', 'foo');
  },
  async after() {
    await servers.stop();
  },
  adapterSetup: () => {
    return new KibanaBackendFrameworkAdapter(servers.kbnServer.server);
  },
});
