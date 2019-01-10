/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import crypto from 'crypto';
import { join, resolve } from 'path';
import { Keystore } from '../../../src/server/keystore';
import { getData } from '../../../src/server/path';
import { SecretStore } from './server';

const path = join(getData(), 'kibana.keystore');
const keystore = new Keystore(path);

export const secretstore = (kibana: any) => {
  return new kibana.Plugin({
    id: 'secretstore',
    require: ['kibana', 'elasticsearch', 'xpack_main'],
    publicDir: resolve(__dirname, 'public'),
    uiExports: {
      savedObjectSchemas: {
        secretType: {
          hidden: true,
        },
      },
    },

    init(server: any) {
      const warn = (message: string | any) => server.log(['secretstore', 'warning'], message);
      warn('Checking for keystore...');
      if (!keystore.exists()) {
        warn('Keystore not found!');
        keystore.reset();
        keystore.save();
        warn(`New keystore created ${keystore.path}`);
      }

      if (!keystore.has('xpack.secretstore.secret')) {
        keystore.add('xpack.secretstore.secret', crypto.randomBytes(128).toString('hex'));
        warn(
          'The keystore did not contain any secret used by the secretstore, one has been auto-generated for use.'
        );
      }

      const so = new SecretStore(
        server.savedObjects,
        'secretType',
        keystore.get('xpack.secretstore.secret')
      );
      server.expose('secretstore', so);
    },
  });
};
