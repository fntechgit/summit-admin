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

// Walks a menu-definition.js tree (getSummitItems/getGlobalItems) and
// returns the ordered list of ancestor folder names (their `name`, not yet
// translated) for whichever leaf's `linkUrl` matches `pathname`.
//
// Allows the breadcrumb to show the same nav folders (Program Management > Activities)
// the sidebar groups a page under, without hardcoding those labels into
// every layout file.
//
// Returns `null` when no leaf matches (page isn't in the
// menu at all) and `[]` when the matching leaf has no folder ancestors.
const findMenuPathInItem = (item, pathname) => {
  if (item.subItems) {
    const childPath = findMenuPath(item.subItems, pathname);
    return childPath !== null ? [item.name, ...childPath] : null;
  }

  if (item.linkUrl) {
    const itemPath = `/app/${item.linkUrl}`;
    if (pathname === itemPath || pathname.startsWith(`${itemPath}/`)) return [];
  }

  return null;
};

export const findMenuPath = (items, pathname) => {
  const path = items
    .map((item) => findMenuPathInItem(item, pathname))
    .find((result) => result !== null);

  return path ?? null;
};
