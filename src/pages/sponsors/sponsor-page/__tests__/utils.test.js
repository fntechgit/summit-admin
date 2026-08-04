/**
 * Copyright 2024 OpenStack Foundation
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

import { normalizeOrder } from "../utils";

describe("normalizeOrder", () => {
  it("normalizes each form and derives the order total", () => {
    const result = normalizeOrder({
      net_amount: 500,
      forms: [
        {
          add_on: { name: "Extra badge" },
          discount_amount: 10,
          discount_type: "percentage",
          discount_in_cents: 100,
          net_amount: 400
        }
      ]
    });

    expect(result.total).toBe(500);
    expect(result.forms[0]).toEqual(
      expect.objectContaining({
        addon_name: "Extra badge",
        discount_total: 100
      })
    );
  });

  it("does not throw when the response omits the forms key", () => {
    expect(() => normalizeOrder({ net_amount: 500 })).not.toThrow();
    expect(normalizeOrder({ net_amount: 500 }).forms).toEqual([]);
  });
});
