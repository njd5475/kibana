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

import { TaskInstance } from './task';
import { TaskPool } from './task_pool';
import { FetchOpts, FetchResult, TaskStore } from './task_store';

interface Opts {
  pool: TaskPool;
  store: TaskStore;
}

export class TaskManager {
  private pool: TaskPool;
  private store: TaskStore;

  constructor(opts: Opts) {
    this.pool = opts.pool;
    this.store = opts.store;
  }

  public async schedule(task: TaskInstance) {
    await this.store.schedule(task);
    this.pool.checkForWork();
  }

  public fetch(opts: FetchOpts = {}): Promise<FetchResult> {
    return this.store.fetch(opts);
  }

  public remove(id: string): Promise<void> {
    return this.store.remove(id);
  }
}
