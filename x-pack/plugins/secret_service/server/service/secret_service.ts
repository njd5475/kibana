/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

// @ts-ignores
import nodeCrypto from '@elastic/node-crypto';
import { SavedObjectsRepository } from 'src/legacy/server/saved_objects';
import uuid from 'uuid';
// @ts-ignore
import { AuditLogger } from '../../../server/lib/audit_logger';

type SSEvents = 'secret_object_created' | 'secret_object_accessed' | 'secret_object_decrypt_failed';
type SecretId = Promise<string>;

export const CONFIG_KEY_NAME = 'xpack.secret_service.secret';

export class SecretService {
  public readonly hideAttribute: (deets: any) => SecretId;
  public readonly unhideAttribute: (deets: any) => any;
  public readonly validateKey: () => Promise<boolean>;
  private readonly hideAttributeWithId: (id: string, toEncrypt: any) => SecretId;

  constructor(
    private readonly savedObjectsRepository: SavedObjectsRepository,
    private readonly type: string,
    private readonly encryptionKey: string,
    private readonly auditor?: AuditLogger
  ) {
    const crypt = nodeCrypto({ encryptionKey: this.encryptionKey });
    const logEvent = (event: SSEvents, message?: string) => {
      if (this.auditor) {
        this.auditor.log(event, message);
      }
    };

    this.hideAttribute = async (toEncrypt: any) => {
      return this.hideAttributeWithId(uuid.v4(), toEncrypt);
    };

    this.hideAttributeWithId = async (id: string, toEncrypt: any) => {
      // now encrypt
      const secret = await crypt.encrypt(toEncrypt);

      // lastly put the encrypted details into the saved object
      const saved = await this.savedObjectsRepository.create(this.type, { secret }, { id });

      logEvent('secret_object_created', `Secret object id:${saved.id} was created`);

      return saved.id;
    };

    this.unhideAttribute = async (id: string) => {
      // retrieve the saved object by id.
      const savedObject: any = await this.savedObjectsRepository.get(this.type, id);

      // extract the hidden secret value
      const toDecrypt = savedObject.attributes.secret;

      // decrypt the details
      try {
        const unhidden = await crypt.decrypt(toDecrypt);

        logEvent('secret_object_accessed', `Saved object id:${savedObject.id} accessed`);

        return {
          ...savedObject,
          attributes: {
            ...unhidden,
          },
        };
      } catch (e) {
        logEvent(
          'secret_object_decrypt_failed',
          `Config key '${CONFIG_KEY_NAME}' is not valid, please ensure your kibana keystore is setup properly!`
        );
        const err = new Error(`SecretService Decrypt Failed: ${e.message}`);
        err.stack = e.stack;
        throw err;
      }
    };

    this.validateKey = async () => {
      const id = '1.0.0:dummy';
      const secret = 'Secret Service v1.0.0';
      let objToValidate;
      try {
        // attempt to encrypt a specific saved object.
        objToValidate = await this.hideAttributeWithId(id, { version: secret });
      } catch (e) {
        // creation failed for some reason
        if (!this.savedObjectsRepository.errors.isConflictError(e)) {
          // because there was already a document with the id
          throw e;
        }
      }

      try {
        // either we created a new one or we are checking the existing one.
        objToValidate = await this.unhideAttribute(id);
      } catch (e) {
        // could not successfully decrypt either, so the key is not valid
        return false;
      }

      // additionally we can validate the message we decrypted
      return objToValidate.attributes
        ? objToValidate.attributes.version === 'Secret Service v1.0.0'
        : false;
    };
  }
}
