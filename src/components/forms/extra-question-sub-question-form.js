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
import T from 'i18n-react/dist/i18n-react'
import { Dropdown, RadioList } from 'openstack-uicore-foundation/lib/components'
import { isEmpty, scrollToError, shallowEqual, hasErrors } from "../../utils/methods";


class ExtraQuestionSubQuestionForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            entity: { ...props.entity },
            errors: props.errors
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const state = {};
        // scrollToError(this.props.errors);

        // if (!shallowEqual(prevProps.entity, this.props.entity)) {
        //     state.entity = { ...this.props.entity };
        //     state.errors = {};
        // }

        // if (!shallowEqual(prevProps.errors, this.props.errors)) {
        //     state.errors = { ...this.props.errors };
        // }

        // if (!isEmpty(state)) {
        //     this.setState({ ...this.state, ...state })
        // }
    }

    handleSubmit(ev) {
        ev.preventDefault();
        this.props.onSubmit(this.state.entity);
    }

    generateAnswerField() {
        const { currentExtraQuestion } = this.props;
        const { entity } = this.state;

        switch (currentExtraQuestion.type) {
            // case 'TextArea':
            // case 'Text': {
            //     return (
            //         <div>
            //             <input
            //                 id="answer_custom_value"
            //                 value={entity.answer_custom_value}
            //                 placeholder={T.translate("question_rule_form.placeholders.type_value")}
            //                 onChange={this.handleChange} />
            //         </div>
            //     )
            // }                
            // case 'CheckBox':
            case 'ComboBox':
            case 'CheckBoxList':
            case 'RadioButtonList': {
                let answer_values_ddl = currentExtraQuestion.values
                    .map(et => ({ value: et.id, label: et.label }));
                return (
                    <Dropdown
                        id="answer_values"
                        isMulti={true}
                        value={entity.answer_values.map(e => parseInt(e))}
                        placeholder={T.translate("question_rule_form.placeholders.select_values")}
                        options={answer_values_ddl}
                        onChange={this.handleChange}
                    />
                )
            }
            default:
                break;
        }
    }

    handleChange(ev) {
        const entity = { ...this.state.entity };
        const errors = { ...this.state.errors };
        let { value, id } = ev.target;

        if (ev.target.type === 'checkbox') {
            value = ev.target.checked;
        }

        errors[id] = '';
        entity[id] = value;
        this.setState({ entity: entity, errors: errors });
    }

    render() {
        const { entity, errors } = this.state;
        const { extraQuestions, currentExtraQuestion } = this.props;
        
        const question_ddl = extraQuestions
            .filter(e => e.id !== currentExtraQuestion.id)
            .map(et => ({ value: et.id, label: et.name }));

        const answer_values_operators_dll = [{ value: 'And', label: 'And' }, { value: 'Or', label: 'Or' }];
        const visibility_ddl = [{ value: 'Visible', label: 'Show' }, { value: 'NotVisible', label: 'Hide' }];
        const visibility_condition_ddl = [{ value: 'Equal', label: 'Equal' }, { value: 'NotEqual', label: 'Not Equal' }];

        return (
            <form className="question-form">
                <input type="hidden" id="id" value={currentExtraQuestion.id} />
                <div className="sub-rule-form form-group">
                    <div className="radio-wrapper">
                        <span>{T.translate("question_rule_form.attendee_chooses")}</span>
                        <RadioList
                            id='visibility_condition'
                            value={entity.visibility_condition}
                            options={visibility_condition_ddl}
                            onChange={this.handleChange}
                            inline
                            html
                        />
                    </div>
                    <div className="col-md-3">
                        {T.translate("question_rule_form.to")}
                        {this.generateAnswerField()}
                    </div>
                    <div className="radio-wrapper">
                        <span>{T.translate("question_rule_form.with")}</span>
                        <RadioList
                            id='answer_values_operator'
                            value={entity.answer_values_operator}
                            options={answer_values_operators_dll}
                            onChange={this.handleChange}
                            inline
                            html
                        />
                    </div>
                    <div className="radio-wrapper">
                        <span>{T.translate("question_rule_form.then")}</span>
                        <RadioList
                            id='visibility'
                            value={entity.visibility}
                            options={visibility_ddl}
                            onChange={this.handleChange}
                            inline
                            html
                        />
                    </div>
                    <div className="col-md-3">
                        <Dropdown
                            id="sub_question_id"
                            value={entity.sub_question_id}
                            placeholder={T.translate("question_rule_form.placeholders.sub_question")}
                            options={question_ddl}
                            onChange={this.handleChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12 submit-buttons">
                        <input type="button" onClick={this.handleSubmit}
                            className="btn btn-primary pull-right" value={T.translate("general.save")} />
                    </div>
                </div>
            </form>
        );
    }
}

export default ExtraQuestionSubQuestionForm;
