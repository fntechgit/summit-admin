/**
 * Copyright 2020 OpenStack Foundation
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

import React from "react";
import T from "i18n-react/dist/i18n-react";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import Input from "openstack-uicore-foundation/lib/components/inputs/text-input"
import MemberInput from "openstack-uicore-foundation/lib/components/inputs/member-input"
import SummitInput from "openstack-uicore-foundation/lib/components/inputs/summit-input";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import {
  scrollToError,
  hasErrors,
  shallowEqual,
  isEmpty
} from "../../utils/methods";

class AdminAccessForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      entity: { ...props.entity },
      errors: props.errors
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidUpdate(prevProps) {
    const state = {};
    scrollToError(this.props.errors);

    if (!shallowEqual(prevProps.entity, this.props.entity)) {
      state.entity = { ...this.props.entity };
      state.errors = {};
    }

    if (!shallowEqual(prevProps.errors, this.props.errors)) {
      state.errors = { ...this.props.errors };
    }

    if (!isEmpty(state)) {
      this.setState({ ...this.state, ...state });
    }
  }

  handleChange(ev) {
    const entity = { ...this.state.entity };
    const errors = { ...this.state.errors };
    const { value, id } = ev.target;

    errors[id] = "";
    entity[id] = value;

    this.setState({ entity, errors });
  }

  handleSubmit(ev) {
    const { entity } = this.state;
    ev.preventDefault();

    this.props.onSubmit(entity);
  }

  render() {
    const { entity, errors } = this.state;

    return (
      <Box
        component="form"
        className="admin-access-form"
        sx={{ width: "100%" }}
      >
        <input type="hidden" id="id" value={entity.id} />
        <Grid2 container spacing={2}>
          <Grid2 size={12}>
            <Typography component="label" sx={{ display: "block", mb: 0.5 }}>
              {T.translate("admin_access.title")} *
            </Typography>
            <Input
              id="title"
              value={entity.title}
              onChange={this.handleChange}
              className="form-control"
              error={hasErrors("title", errors)}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography component="label" sx={{ display: "block", mb: 0.5 }}>
              {T.translate("admin_access.members")} *
            </Typography>
            <MemberInput
              id="members"
              value={entity.members}
              getOptionLabel={(member) => member.hasOwnProperty("email")
                  ? `${member.first_name} ${member.last_name} (${member.email})`
                  : `${member.first_name} ${member.last_name} (${member.id})`}
              onChange={this.handleChange}
              multi
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography component="label" sx={{ display: "block", mb: 0.5 }}>
              {T.translate("admin_access.summits")} *
            </Typography>
            <SummitInput
              id="summits"
              value={entity.summits}
              onChange={this.handleChange}
              multi
            />
          </Grid2>
          <Grid2
            size={12}
            sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}
          >
            <Button
              type="button"
              variant="contained"
              onClick={this.handleSubmit}
            >
              {T.translate("general.save")}
            </Button>
          </Grid2>
        </Grid2>
      </Box>
    );
  }
}

export default AdminAccessForm;
