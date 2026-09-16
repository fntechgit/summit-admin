import React, { useEffect, useState } from "react";
import { Grid2 } from "@mui/material";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";

const formatLabel = (name, type) =>
  type && type !== "object" ? `${name} (${type})` : name;

const populateChildren = (entries) =>
  entries.map((s) => ({ name: formatLabel(s[0], s[1].type) }));

const expand = (name, def) => {
  if (!def) return null;

  if (def.type === "array") {
    return expand(formatLabel(name, def.type), def.items);
  }
  if (def.type === "object") {
    const res = expand(formatLabel(name, def.type), def.properties);
    const props = Object.entries(def.properties);

    res.children = populateChildren(props);

    // expand nested objects
    props.forEach((prop, index) => {
      const propDef = prop[1];
      let expanded = null;
      if (propDef.type === "array") {
        expanded = expand(prop[0], {
          type: propDef.type,
          items: propDef.items
        });
      } else if (propDef.type === "object") {
        expanded = expand(prop[0], {
          type: propDef.type,
          properties: propDef.properties
        });
      }
      const child = res.children[index];
      if (child && expanded) child.children = expanded.children;
    });

    return res;
  }

  const entries = Object.entries(def);

  if (entries.length === 1) {
    return { name: formatLabel(name, def.type), children: [] };
  }

  return { name, children: populateChildren(entries) };
};

const toTreeItems = (nodes, idPrefix) =>
  nodes.map((node, index) => {
    const itemId = `${idPrefix}-${index}`;
    return (
      <TreeItem key={itemId} itemId={itemId} label={node.name}>
        {node.children?.length > 0 ? toTreeItems(node.children, itemId) : null}
      </TreeItem>
    );
  });

const TemplateSchemaTree = ({ templateSchema }) => {
  const [treeData, setTreeData] = useState([]);

  useEffect(() => {
    if (templateSchema) {
      const data = Object.entries(templateSchema)
        .map((entry) => expand(entry[0], entry[1]))
        .filter((node) => node);
      setTreeData(data);
    } else {
      setTreeData([]);
    }
  }, [templateSchema]);

  if (treeData.length === 0) return null;

  const COLUMN_COUNT = 2;
  const midpoint = Math.ceil(treeData.length / COLUMN_COUNT);
  const columns = [treeData.slice(0, midpoint), treeData.slice(midpoint)];

  return (
    <Grid2 container spacing={2}>
      {columns.map(
        (columnNodes, columnIndex) =>
          columnNodes.length > 0 && (
            // eslint-disable-next-line react/no-array-index-key
            <Grid2 key={columnIndex} size={{ xs: 12, md: 6 }}>
              <SimpleTreeView
                aria-label={`Template schema tree ${columnIndex + 1}`}
              >
                {toTreeItems(columnNodes, `col${columnIndex}`)}
              </SimpleTreeView>
            </Grid2>
          )
      )}
    </Grid2>
  );
};

export default TemplateSchemaTree;
