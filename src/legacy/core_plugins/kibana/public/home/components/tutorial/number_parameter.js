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

import React from 'react';
import PropTypes from 'prop-types';

export function NumberParameter({ id, label, value, setParameter }) {
  const handleChange = (evt) => {
    setParameter(id, parseFloat(evt.target.value));
  };

  return (
    <div className="kuiSideBarFormRow">
      <label
        className="kuiSideBarFormRow__label"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="kuiSideBarFormRow__control kuiFieldGroupSection--wide">
        <input
          className="kuiTextInput"
          type="number"
          value={value}
          onChange={handleChange}
          id={id}
        />
      </div>
    </div>
  );
}

NumberParameter.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  setParameter: PropTypes.func.isRequired,
};
