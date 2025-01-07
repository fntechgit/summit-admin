/**
 * Copyright 2025 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

const CENTS_FACTOR = 100;
const DECIMAL_PLACES = 2;

/**
 * Converts a decimal amount to cents.
 * @param {number|string} amount - The amount in decimal format (e.g., 12.34).
 * @returns {number} - The amount converted to cents (e.g., 1234).
 */
export const amountToCents = (amount) => {
  const normalizedAmount = parseFloat(amount);
  if (isNaN(normalizedAmount)) {
    throw new Error("The provided value is not a valid number.");
  }
  return Math.round(normalizedAmount * CENTS_FACTOR);
};

/**
 * Converts an amount in cents to decimal format.
 * @param {number} cents - The amount in cents (e.g., 1234).
 * @returns {string} - The amount converted to decimal format (e.g., "12.34").
 */
export const amountFromCents = (cents) => {
  if (typeof cents !== "number" || !Number.isInteger(cents)) {
    throw new Error("The provided value must be an integer.");
  }
  return (cents / CENTS_FACTOR).toFixed(DECIMAL_PLACES);
};
