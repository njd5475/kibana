/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import crypto from 'crypto';
import { resolve } from 'path';
import mappings from './mappings.json';
import { SecretService } from './server';

export const secretService = (kibana: any) => {
  return new kibana.Plugin({
    id: 'SecretService',
    require: ['kibana', 'elasticsearch', 'xpack_main'],
    configPrefix: 'xpack.secret_service',
    publicDir: resolve(__dirname, 'public'),
    uiExports: {
      mappings,
      savedObjectSchemas: {
        secretType: {
          hidden: true,
        },
      },
    },

    config(Joi: any) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        secret: Joi.string().default(undefined),
      }).default();
    },

    configKey: 'xpack.secret_service.secret',

    init(server: any) {
      const keystore: any = new server.Keystore(server.config().get('path.data'));

      const warn = (message: string | any) => server.log(['secret-service', 'warning'], message);

      if (!keystore.exists()) {
        keystore.reset();
        keystore.save();
        warn(`Keystore missing, new keystore created ${keystore.path}`);
      }

      if (!keystore.has(this.configKey)) {
        keystore.add(this.configKey, crypto.randomBytes(128).toString('hex'));
        warn('Missing key - one has been auto-generated for use.');
        keystore.save();
      }

      const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('admin');
      const so = server.savedObjects.getSavedObjectsRepository(callWithInternalUser, [
        'secretType',
      ]);

      server.expose(
        'secretService',
        new SecretService(so, 'secretType', keystore.get(this.configKey))
      );
    },
  });
};
