/**
 * Copyright 2023 OpenStack Foundation
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

import React from 'react';
import { connect } from 'react-redux';
import {Dropdown, Input } from 'openstack-uicore-foundation/lib/components';
import PromoCodeInput from '../inputs/promo-code-input';
import {queryMultiSpeakersPromocodes} from '../../actions/promocode-specification-actions';

class SpeakerPromoCodeSpecForm extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            entity: {...props.entity},
            errors: props.errors
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleChangePromoCodeAutomaticSpec = this.handleChangePromoCodeAutomaticSpec.bind(this);
    }
  
    handleChange(ev) {
        let entity = {...this.state.entity};
        let errors = {...this.state.errors};
        let {value, id} = ev.target;

        errors[id] = '';
        entity[id] = value;
        this.setState({entity: entity, errors: errors});
    }

    handleChangePromoCodeAutomaticSpec(ev) {

    }

    render() {
        const { entity, promoCodeStrategy, summit } = this.props;

        let promoCodeTagsDDL = [
            { label: '-- SELECT TAGS --', value: 0 },
        ];

        let promoCodeBadgeFeaturesDDL = [
            { label: '-- SELECT BADGE FEATURES --', value: 0 },
        ];

        let promoCodeTicketTypesDDL = [
            { label: '-- SELECT TICKET TYPES --', value: 0 },
        ];

        return (
            <form className="speakers-promo-code-spec-form">
                { (promoCodeStrategy === 1 || promoCodeStrategy === 2) &&
                <div className="row form-group">
                    <div className="col-md-12">
                        <PromoCodeInput
                            id="promo_code"
                            value={entity?.existingPromoCodeId}
                            summitId={summit.id}
                            onChange={this.handleChange}
                            placeholder={promoCodeStrategy === 1 ? '-- SELECT SPEAKERS PROMO CODE --' : '-- SELECT SPEAKERS DISCOUNT CODE --'}
                            customQueryAction={queryMultiSpeakersPromocodes}
                            isClearable={true}
                        />
                    </div>
                </div>
                }
                { (promoCodeStrategy === 3 || promoCodeStrategy === 4) &&
                <>
                    <div className="row form-group">
                        <div className="col-md-12">
                            <Dropdown
                                id="promoCodeTypeSelector"
                                value={0}
                                onChange={this.handleChangePromoCodeAutomaticSpec}
                                options={promoCodeTypeDDL}
                                isClearable={true}
                            />
                        </div>
                    </div>
                    <div className="row form-group">
                        <div className="col-md-12">
                            <Dropdown
                                id="promoCodeTagsSelector"
                                value={0}
                                onChange={this.handleChangePromoCodeAutomaticSpec}
                                options={promoCodeTagsDDL}
                                isClearable={true}
                            />
                        </div>
                    </div>
                    <div className="row form-group">
                        <div className="col-md-12">
                            <Dropdown
                                id="promoCodeBadgeFeaturesSelector"
                                value={0}
                                onChange={this.handleChangePromoCodeAutomaticSpec}
                                options={promoCodeBadgeFeaturesDDL}
                                isClearable={true}
                            />
                        </div>
                    </div>
                    <div className="row form-group">
                        <div className="col-md-12">
                            <Dropdown
                                id="promoCodeTicketTypesSelector"
                                value={0}
                                onChange={this.handleChangePromoCodeAutomaticSpec}
                                options={promoCodeTicketTypesDDL}
                            />
                        </div>
                    </div>
                    <div className="row form-group">
                        <div className="col-md-5">
                            <Input 
                                id="amount" 
                                type="number" 
                                className="form-control" 
                                placeholder="Amount"
                                onChange={this.handleChangePromoCodeAutomaticSpec}
                            />
                        </div>
                        <div className="col-md-2">
                            OR
                        </div>
                        <div className="col-md-5">
                            <Input 
                                id="discount" 
                                type="number" 
                                className="form-control" 
                                placeholder="Discount"
                                onChange={this.handleChangePromoCodeAutomaticSpec}
                            />
                        </div>
                    </div>
                    <hr />
                </>
                }
            </form>
        );
    }
}

const mapStateToProps = ({ currentPromocodeSpecificationState }) => ({
    ...currentPromocodeSpecificationState
})

export default connect(
    mapStateToProps,
    {
        //queryMultiSpeakersPromocodes
    }
)(SpeakerPromoCodeSpecForm);
