/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

export type LogFn = (prefix: string[], msg: string) => void;

type SimpleLogFn = (msg: string) => void;

export interface Logger {
  error: SimpleLogFn;
  warning: SimpleLogFn;
  debug: SimpleLogFn;
  info: SimpleLogFn;
  derive(...tags: string[]): Logger;
}

export class TaskManagerLogger implements Logger {
  private write: LogFn;
  private readonly tags: string[];

  constructor(log: LogFn, tags: string[] = ['task_manager']) {
    this.write = log;
    this.tags = tags;
  }

  public error(msg: string) {
    this.log('error', msg);
  }

  public warning(msg: string) {
    this.log('warning', msg);
  }

  public debug(msg: string) {
    this.log('debug', msg);
  }

  public info(msg: string) {
    this.log('info', msg);
  }

  public derive(...tags: string[]): Logger {
    return new TaskManagerLogger(this.write, [...this.tags, ...tags]);
  }

  private log(type: string, msg: string) {
    this.write([type, ...this.tags], msg);
  }
}
