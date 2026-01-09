import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import * as React from "react";
import { Typography } from "@mui/material";

const NotesRow = ({ colCount, note }) => (
    <TableRow>
      <TableCell sx={{ fontWeight: 800 }} colSpan={colCount}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {note}
        </Typography>
      </TableCell>
    </TableRow>
  );

export default NotesRow;
