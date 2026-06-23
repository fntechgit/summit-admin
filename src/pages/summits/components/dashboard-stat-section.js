import React from "react";
import PropTypes from "prop-types";
import Divider from "@mui/material/Divider";
import Grid2 from "@mui/material/Grid2";
import DashboardSection from "./dashboard-section";
import SummitDashboardStat from "./summit-dashboard-stat";

const GRID_COLUMNS = 12;

function DashboardStatSection({ title, rows }) {
  return (
    <DashboardSection title={title} variant="card">
      {rows.map((group, i) => {
        if (!group.length) return null;
        const size = Math.floor(GRID_COLUMNS / group.length);
        const key = group[0]?.title ?? `group-${i}`;
        return (
          <React.Fragment key={key}>
            {i > 0 && <Divider />}
            <Grid2 container>
              {group.map(({ title: label, stat: value }) => (
                <Grid2 key={label} size={size}>
                  <SummitDashboardStat label={label} value={value} />
                </Grid2>
              ))}
            </Grid2>
          </React.Fragment>
        );
      })}
    </DashboardSection>
  );
}

DashboardStatSection.propTypes = {
  title: PropTypes.string.isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        stat: PropTypes.number
      })
    )
  ).isRequired
};

export default DashboardStatSection;
