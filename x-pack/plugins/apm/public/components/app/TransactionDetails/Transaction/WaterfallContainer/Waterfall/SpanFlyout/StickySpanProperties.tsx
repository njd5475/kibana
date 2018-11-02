/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

// tslint:disable-next-line  no-var-requires
import React from 'react';

import { first } from 'lodash';
import { Span } from '../../../../../../../../typings/Span';
import { asMillis, asPercent } from '../../../../../../../utils/formatters';
// @ts-ignore
import { StickyProperties } from '../../../../../../shared/StickyProperties';

function getSpanLabel(type: string) {
  switch (type) {
    case 'db':
      return 'DB';
    case 'hard-navigation':
      return 'Navigation timing';
    default:
      return type;
  }
}

function getPrimaryType(type: string) {
  return first(type.split('.'));
}

interface Props {
  span: Span;
  totalDuration?: number;
}

export function StickySpanProperties({ span, totalDuration }: Props) {
  if (!totalDuration) {
    return null;
  }

  const spanName = span.span.name;
  const spanDuration = span.span.duration.us;
  const spanTypeLabel = getSpanLabel(getPrimaryType(span.span.type));

  const stickyProperties = [
    {
      label: 'Name',
      fieldName: 'span.name',
      val: spanName || 'N/A',
      truncated: true,
      width: '50%'
    },
    {
      fieldName: 'span.type',
      label: 'Type',
      val: spanTypeLabel,
      truncated: true,
      widht: '50%'
    },
    {
      fieldName: 'span.duration.us',
      label: 'Duration',
      val: asMillis(spanDuration),
      width: '50%'
    },
    {
      label: '% of transaction',
      val: asPercent(spanDuration, totalDuration),
      width: '50%'
    }
  ];

  return <StickyProperties stickyProperties={stickyProperties} />;
}
