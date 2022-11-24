/**
 * Copyright 2018 OpenStack Foundation
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
import { Breadcrumb } from 'react-breadcrumbs';
import T from "i18n-react/dist/i18n-react";
import SponsorForm from '../../components/forms/sponsor-form';
import {
    saveSponsor,
    addMemberToSponsor,
    removeMemberFromSponsor,
    createCompany,
    deleteSponsorAdvertisement,
    deleteSponsorMaterial,
    deleteSponsorSocialNetwork,
    removeSponsorImage,
    attachSponsorImage,
    getSponsorAdvertisements,
    getSponsorMaterials,
    getSponsorSocialNetworks,
} from "../../actions/sponsor-actions";

class EditSponsorPage extends React.Component {

    componentDidMount() {
        const { entity } = this.props;
        if (entity.id > 0) {
            this.props.getSponsorAdvertisements(entity.id);
            this.props.getSponsorMaterials(entity.id);
            this.props.getSponsorSocialNetworks(entity.id);
        }
    }

    render() {
        const { currentSummit, entity, errors, match, history, sponsorships } = this.props;
        const title = (entity.id) ? T.translate("general.edit") : T.translate("general.add");

        return (
            <div className="container">
                <h3>{title} {T.translate("edit_sponsor.sponsor")}</h3>
                <hr />
                {currentSummit &&
                <SponsorForm
                    history={history}
                    entity={entity}
                    currentSummit={currentSummit}
                    sponsorships={sponsorships}
                    errors={errors}
                    onCreateCompany={this.props.createCompany}
                    onAttachImage={this.props.attachSponsorImage}
                    onRemoveImage={this.props.removeSponsorImage}
                    onAddMember={this.props.addMemberToSponsor}
                    onRemoveMember={this.props.removeMemberFromSponsor}
                    onAdvertisementDelete={this.props.deleteSponsorAdvertisement}
                    onMaterialDelete={this.props.deleteSponsorMaterial}
                    onSocialNetworkDelete={this.props.deleteSponsorSocialNetwork}
                    onSubmit={this.props.saveSponsor}
                    getSponsorAdvertisements={this.props.getSponsorAdvertisements}
                    getSponsorMaterials={this.props.getSponsorMaterials}
                    getSponsorSocialNetworks={this.props.getSponsorSocialNetworks}
                />
                }
            </div>
        )
    }
}

const mapStateToProps = ({ currentSummitState, currentSponsorState, currentSummitSponsorshipListState }) => ({
    currentSummit: currentSummitState.currentSummit,
    sponsorships: currentSummitSponsorshipListState.sponsorships,
    ...currentSponsorState
});

export default connect(
    mapStateToProps,
    {
        saveSponsor,
        addMemberToSponsor,
        removeMemberFromSponsor,
        createCompany,
        deleteSponsorAdvertisement,
        deleteSponsorMaterial,
        deleteSponsorSocialNetwork,
        removeSponsorImage,
        attachSponsorImage,
        getSponsorAdvertisements,
        getSponsorMaterials,
        getSponsorSocialNetworks
    }
)(EditSponsorPage);
