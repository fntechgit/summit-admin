/**
 * Copyright 2019 OpenStack Foundation
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
import { connect } from 'react-redux';
import T from 'i18n-react/dist/i18n-react';
import Swal from "sweetalert2";
import { Table, SortableTable } from 'openstack-uicore-foundation/lib/components';
import { getSummitById }  from '../../actions/summit-actions';
import { getSummitSponsorships, deleteSummitSponsorship } from "../../actions/sponsor-actions";

class SummitSponsorshipListPage extends React.Component {

    constructor(props) {
        super(props);

        this.handleEdit = this.handleEdit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handleNewSponsorship = this.handleNewSponsorship.bind(this);

        this.state = {}

    }

    componentDidMount() {
        const {currentSummit} = this.props;
        if(currentSummit) {
            this.props.getSummitSponsorships();
        }
    }

    handleEdit(sponsorship_id) {
        const {currentSummit, history} = this.props;
        history.push(`/app/summits/${currentSummit.id}/sponsorships/${sponsorship_id}`);
    }

    handleDelete(sponsorshipId) {
        const {deleteSummitSponsorship, sponsorships} = this.props;
        let sponsorship = sponsorships.find(t => t.id === sponsorshipId);

        Swal.fire({
            title: T.translate("general.are_you_sure"),
            text: T.translate("sponsorship_list.remove_warning") + ' ' + sponsorship.name,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: T.translate("general.yes_delete")
        }).then(function(result){
            if (result.value) {
                deleteSummitSponsorship(sponsorshipId);
            }
        });
    }

    handleSort(index, key, dir, func) {
        this.props.getSummitSponsorships(key, dir);
    }

    handleNewSponsorship(ev) {
        const {currentSummit, history} = this.props;
        history.push(`/app/summits/${currentSummit.id}/sponsorships/new`);
    }

    render(){
        const {currentSummit, sponsorships, order, orderDir, totalSponsorships} = this.props;

        const sortedSponsorships = sponsorships.sort((a, b) => a.order -b.order);

        const columns = [
            { columnKey: 'sponsorship_type', value: T.translate("sponsorship_list.sponsorship_type"), sortable: true },
            { columnKey: 'widget_title', value: T.translate("sponsorship_list.widget_title"), sortable: true },
        ];

        const table_options = {            
            actions: {
                edit: { onClick: this.handleEdit },
                delete: { onClick: this.handleDelete }
            }
        }

        if(!currentSummit.id) return (<div />);

        return(
            <div className="container">
                <h3> {T.translate("sponsorship_list.sponsorship_list")} ({totalSponsorships})</h3>
                <div className={'row'}>
                    <div className="col-md-6 text-right col-md-offset-6">
                        <button className="btn btn-primary right-space" onClick={this.handleNewSponsorship}>
                            {T.translate("sponsorship_list.add_sponsorship")}
                        </button>
                    </div>
                </div>

                {sortedSponsorships.length === 0 &&
                <div>{T.translate("sponsorship_list.no_sponsorships")}</div>
                }

                {sortedSponsorships.length > 0 &&
                    <Table
                        options={table_options}
                        data={sortedSponsorships}
                        columns={columns}
                    />
                    // <SortableTable
                    //     options={table_options}
                    //     data={sortedSponsorships}
                    //     columns={columns}
                    //     dropCallback={(ev) => console.log('change order...', ev)}
                    //     orderField="order"
                    // />
                }

            </div>
        )
    }
}

const mapStateToProps = ({ currentSummitState, currentSummitSponsorshipListState }) => ({
    currentSummit   : currentSummitState.currentSummit,
    ...currentSummitSponsorshipListState
})

export default connect (
    mapStateToProps,
    {
        getSummitById,
        getSummitSponsorships,
        deleteSummitSponsorship
    }
)(SummitSponsorshipListPage);
