import React from "react";
import {Dropdown} from "openstack-uicore-foundation/lib/components";
import T from "i18n-react";


const InvitationStatusDropdown = ({id, value, onChange, ...rest}) => {
    const options =[
        {label: 'Pending', value: 'pending'},
        {label: 'Accepted', value: 'accepted'},
        {label: 'Rejected', value: 'rejected'}
    ];

    return (
        <Dropdown
            id={id}
            value={value}
            onChange={onChange}
            options={options}
            placeholder={T.translate("general.placeholders.select_invitation_status")}
            {...rest}
        />
    );
};

export default InvitationStatusDropdown;