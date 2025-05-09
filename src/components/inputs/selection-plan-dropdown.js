import React from "react";
import { Dropdown } from "openstack-uicore-foundation/lib/components";

const SelectionPlanDropdown = ({ id, value, onChange, selectionPlans, ...rest }) => {
  const options = selectionPlans.map(sp => ({ label: sp.name, value: sp.id }));

  return (
    <Dropdown
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      {...rest}
    />
  );
};

export default SelectionPlanDropdown;

