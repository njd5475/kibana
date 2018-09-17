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

import { initRoutes } from './init_routes';

export default function (kibana) {
  return new kibana.Plugin({
    name: 'sampleTask',

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    uiExports: {
      taskDefinitions: {
        sampleTask: {
          title: 'Sample Task',
          description: 'A sample task for testing the task_manager.',
          timeOut: '1m',
          numWorkers: 2,

          // This task allows tests to specify its behavior (whether it reschedules itself, whether it errors, etc)
          // taskInstance.params has the following optional fields:
          // nextRunMilliseconds: number - If specified, the run method will return a runAt that is now + nextRunMilliseconds
          // failWith: string - If specified, the task will throw an error with the specified message
          createTaskRunner: ({ kbnServer, taskInstance }) => ({
            async run() {
              const { params, state } = taskInstance;
              const prevState = state || { count: 0 };

              if (params.failWith) {
                throw new Error(params.failWith);
              }

              const callCluster = kbnServer.server.plugins.elasticsearch.getCluster('admin').callWithInternalUser;
              await callCluster('index', {
                index: '.task_manager_test_result',
                type: '_doc',
                body: {
                  type: 'task',
                  taskId: taskInstance.id,
                  params: JSON.stringify(params),
                  state: JSON.stringify(state),
                  ranAt: new Date(),
                },
              });

              return {
                state: { count: prevState.count + 1 },
                runAt: millisecondsFromNow(params.nextRunMilliseconds),
              };
            },
          }),
        },
      },
    },

    init(server) {
      server.taskManager.addMiddleware({
        async beforeSave({ taskInstance, ...opts }) {
          const modifiedInstance = {
            ...taskInstance,
            params: {
              originalParams: taskInstance.params,
              superFly: 'My middleware param!',
            },
          };
          return {
            ...opts,
            taskInstance: modifiedInstance,
          };
        },

        async beforeRun({ taskInstance, ...opts }) {
          return {
            ...opts,
            taskInstance: {
              ...taskInstance,
              params: taskInstance.originalParams,
            },
          };
        },
      });

      initRoutes(server);
    },
  });
}

function millisecondsFromNow(ms) {
  if (!ms) {
    return;
  }

  const dt = new Date();
  dt.setTime(dt.getTime() + ms);
  return dt;
}
