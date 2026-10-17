/**
 * Copyright 2026 OpenStack Foundation
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

// key: a crumb pathname; value: the link's folder names and the crumb they go after
export const addMenuLinks = (items, anchor, map, folders = []) => {
  items.forEach((item) => {
    if (item.subItems) {
      addMenuLinks(item.subItems, anchor, map, [...folders, item.name]);
    } else if (item.linkUrl) {
      map.set(`/app/${item.linkUrl}`, { folders, anchor });
    }
  });
  return map;
};
