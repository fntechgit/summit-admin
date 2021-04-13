/**
 * Copyright 2017 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

import React from 'react'
import T from 'i18n-react/dist/i18n-react'
import 'awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css'
import {TextEditor, Input, SortableTable} from 'openstack-uicore-foundation/lib/components';
import {isEmpty, scrollToError, shallowEqual} from "../../utils/methods";

class SponsoredProjectSponsorshipTypeForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            entity: {...props.entity},
            errors: props.errors,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleEditSponsorshipType = this.handleEditSponsorshipType.bind(this);
        this.handleAddSupportingCompany = this.handleAddSupportingCompany.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const state = {};
        scrollToError(this.props.errors);

        if(!shallowEqual(prevProps.entity, this.props.entity)) {
            state.entity = {...this.props.entity};
            state.errors = {};
        }

        if (!shallowEqual(prevProps.errors, this.props.errors)) {
            state.errors = {...this.props.errors};
        }

        if (!isEmpty(state)) {
            this.setState({...this.state, ...state})
        }
    }

    handleChange(ev) {
        const entity = {...this.state.entity};
        const errors = {...this.state.errors};
        let {value, id} = ev.target;

        if (ev.target.type === 'checkbox') {
            value = ev.target.checked;
        }

        errors[id] = '';
        entity[id] = value;
        this.setState({entity: entity, errors: errors});
    }

    handleSubmit(publish, ev) {
        ev.preventDefault();
        this.props.onSubmit(this.state.entity);
    }

    handleEditSponsorshipType(id) {
        const { history, entity, project} = this.props;
        history.push(`/app/sponsored-projects/${project.id}/sponsorship-types/${entity.id}/supporting-companies/${id}`);
    }

    handleAddSupportingCompany(ev) {
        const {history, project, entity} = this.props;
        history.push(`/app/sponsored-projects/${project.id}/sponsorship-types/${entity.id}/supporting-companies/new`);
    }
    
    render() {
        const {entity} = this.state;

        const { onSupportingCompanyDelete, onSupportingCompanyReorder } = this.props;

        let table_options = {
            actions: {
                // just delete
                delete: { onClick: onSupportingCompanyDelete }
            }
        };

        let sortedSupportedCompanies = [...entity.supporting_companies];
        sortedSupportedCompanies.sort(
            (a, b) => (a.order > b.order ? 1 : (a.order < b.order ? -1 : 0))
        );

        let columns = [
            { columnKey: 'id', value: T.translate("general.id") },
            { columnKey: 'company_name', value: T.translate("edit_sponsored_project_sponsorship_type.name") },
        ];

        return (
            <form className="sponsored-project-form">
                <input type="hidden" id="id" value={entity.id} />
                <div className="row form-group">
                    <div className="col-md-6">
                        <label> {T.translate("edit_sponsored_project_sponsorship_type.name")} </label>
                        <Input className="form-control" id="name" value={entity.name} onChange={this.handleChange} />
                    </div>
                    <div className="col-md-6 checkboxes-div">
                        <div className="form-check abc-checkbox">
                            <input type="checkbox" id="is_active"
                                   checked={entity.is_active}
                                   onChange={this.handleChange} className="form-check-input" />
                            <label className="form-check-label" htmlFor="is_active">
                                {T.translate("edit_sponsored_project_sponsorship_type.is_active")}
                            </label>
                        </div>
                    </div>
                </div>
                <div className="row form-group">
                    <div className="col-md-12">
                        <label> {T.translate("edit_sponsored_project_sponsorship_type.description")} </label>
                        <TextEditor id="description" value={entity.description} onChange={this.handleChange} />
                    </div>
                </div>
                {entity.id !== 0 &&
                <div className="row form-group">
                    <div className="col-md-12">
                        <button className="btn btn-primary pull-right" onClick={this.handleAddSupportingCompany}>
                            {T.translate("edit_sponsored_project_sponsorship_type.add_supporting_company")}
                        </button>
                        <SortableTable
                            options={table_options}
                            data={sortedSupportedCompanies}
                            columns={columns}
                            dropCallback={onSupportingCompanyReorder}
                            orderField="order"
                        />
                    </div>
                </div>
                }
                <div className="row">
                    <div className="col-md-12 submit-buttons">
                        <input type="button" onClick={this.handleSubmit.bind(this, false)}
                               className="btn btn-primary pull-right" value={T.translate("general.save")}/>
                    </div>
                </div>
            </form>
        );
    }
}

export default SponsoredProjectSponsorshipTypeForm;
