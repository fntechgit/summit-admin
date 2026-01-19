import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import * as React from "react";
import T from "i18n-react/dist/i18n-react";

const TotalRow = ({ columns, targetCol, total, trailing = 0 }) => {
  return (
    <TableRow>
      {columns.map((col, i) => {
        if (i === 0)
          return (
            <TableCell key={col.columnKey} sx={{ fontWeight: 800, textTransform: "uppercase" }}>
              {T.translate("mui_table.total")}
            </TableCell>
          );
        if (col.columnKey === targetCol)
          return (
            <TableCell key={col.columnKey} sx={{ fontWeight: 800 }}>
              {total}
            </TableCell>
          );
        return <TableCell key={col.columnKey} />;
      })}
      {[...Array(trailing)].map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <TableCell key={`extra-row-total-${i}`} sx={{ width: 40 }} />
      ))}
    </TableRow>
  );
};

export default TotalRow;
