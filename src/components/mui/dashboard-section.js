import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

function DashboardSection({ title, children, variant }) {
  if (variant === "card") {
    return (
      <Card elevation={0}>
        <CardHeader title={title} />
        <Divider />
        {children}
      </Card>
    );
  }

  return (
    <Box>
      <Box sx={{ bgcolor: "background.light_gray", px: 2, py: 2 }}>
        <Typography variant="body2">{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}

DashboardSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["card"])
};

DashboardSection.defaultProps = {
  variant: undefined
};

export default DashboardSection;
