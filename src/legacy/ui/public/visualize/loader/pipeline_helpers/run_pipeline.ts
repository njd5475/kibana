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

// @ts-ignore
import { fromExpression } from '@kbn/interpreter/common';
// @ts-ignore
import { getInterpreter } from 'plugins/interpreter/interpreter';

import { Adapters } from 'ui/inspector';
import { Filters, Query, TimeRange } from 'ui/visualize';

interface InitialContextObject {
  timeRange?: TimeRange;
  filters?: Filters;
  query?: Query;
}

type getInitialContextFunction = () => InitialContextObject;

interface RunPipelineHandlers {
  getInitialContext: getInitialContextFunction;
  inspectorAdapters?: Adapters;
}

export const runPipeline = async (
  expression: string,
  context: object,
  handlers: RunPipelineHandlers
) => {
  const ast = fromExpression(expression);
  const { interpreter } = await getInterpreter();
  const pipelineResponse = await interpreter.interpretAst(ast, context, handlers);
  return pipelineResponse;
};
