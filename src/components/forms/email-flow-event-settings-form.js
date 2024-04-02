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
 **/
import React, {useEffect, useState} from 'react';
import T from 'i18n-react/dist/i18n-react';
import 'awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css';
import {hasErrors, scrollToError} from "../../utils/methods";
import {Input, UploadInput} from "openstack-uicore-foundation/lib/components";
import HexColorInput from '../inputs/hex-color-input';
import Swal from 'sweetalert2';
import {parse} from 'address-rfc2822';

const EmailFlowEventSettingsForm = ({id, entity, errors, ...props}) => {
  const [_errors, setErrors] = useState(errors);
  const [_entity, setEntity] = useState(entity);

  useEffect(() => {
    setEntity(entity);
    setErrors({});
  }, [entity]);

  useEffect(() => {
    scrollToError(errors);
    setErrors(errors)
  }, [errors]);


  const handleChange = (ev) => {
    let {value, id} = ev.target;
    const errorsTmp = {..._errors};
    const entityTmp = {..._entity};

    if (ev.target.type === 'checkbox') {
      value = ev.target.checked;
    }

    errorsTmp[id] = '';

    entityTmp[id] = {...entityTmp[id], value};
    setErrors(errorsTmp);
    setEntity(entityTmp);
  }

  const handleUploadFile = (file, props) => {
    const entityTmp = {..._entity};

    entityTmp[id].file = file;
    entityTmp[id].file_preview = file.preview

    setEntity(entityTmp);
  }

  const handleRemoveFile = (ev, data) => {
    const {id} = data;
    const entityTmp = {..._entity};

    entityTmp[id].file_preview = '';

    if (entityTmp[id].id) {
      entityTmp[id].file = '';
      props.onDeleteImage(entityTmp[id].id);
    }

    setEntity(entityTmp);
  }

  const validate = (settingsToSave) => {
    let result = true;
    const errorsTmp = {};

    if (settingsToSave.EMAIL_TEMPLATE_GENERIC_FROM?.value) {
      try {
        parse(settingsToSave.EMAIL_TEMPLATE_GENERIC_FROM.value)
      } catch(e) {
        errorsTmp.EMAIL_TEMPLATE_GENERIC_FROM = `email is not valid`;
        result = false;
      }
    }
    if (settingsToSave.EMAIL_TEMPLATE_SPEAKERS_FROM?.value) {
      try {
        parse(settingsToSave.EMAIL_TEMPLATE_SPEAKERS_FROM.value)
      } catch(e) {
        errorsTmp.EMAIL_TEMPLATE_SPEAKERS_FROM = `email is not valid`;
        result = false;
      }
    }

    if (!result) {
      setErrors(errorsTmp);
    }

    return result;
  }

  const handleSubmit = (ev) => {
    ev.preventDefault();

    // save only the settings with the following conditions
    const settingsToSave = Object.fromEntries(
      Object.entries(_entity).filter(([key, values]) => {
        return (
          (values.type === 'TEXT' && (values.value !== '' || values.id)) ||
          (values.type === 'HEX_COLOR' && values.value !== '') ||
          (values.type === 'FILE' && values.file)
        );
      })
    );

    if (validate(settingsToSave)) {
      props.onSubmit(settingsToSave).then(() => {
        const success_message = {
          title: T.translate("general.done"),
          html: T.translate("email_flow_events_settings.email_template_settings_updated"),
          type: 'success'
        };

        Swal.fire(success_message);
      });
    }

  }

  return (
    <form className="email-flow-event-form">
      <input type="hidden" id="id" value={_entity.id}/>
      <div className="row form-group">
        <div className='col-md-6'>
          <label>{T.translate("email_flow_events_settings.email_template_generic_banner")}</label><br/>
          <UploadInput
            id="EMAIL_TEMPLATE_GENERIC_BANNER"
            value={_entity?.EMAIL_TEMPLATE_GENERIC_BANNER?.file_preview || _entity?.EMAIL_TEMPLATE_GENERIC_BANNER?.file}
            handleUpload={handleUploadFile}
            handleRemove={handleRemoveFile}
            className="dropzone col-md-6"
            multiple={false}
          />
        </div>
        <div className='col-md-6'>
          <label>{T.translate("email_flow_events_settings.email_template_generic_speaker_banner")}</label><br/>
          <UploadInput
            id="EMAIL_TEMPLATE_GENERIC_SPEAKER_BANNER"
            value={_entity?.EMAIL_TEMPLATE_GENERIC_SPEAKER_BANNER?.file_preview || _entity?.EMAIL_TEMPLATE_GENERIC_SPEAKER_BANNER?.file}
            handleUpload={handleUploadFile}
            handleRemove={handleRemoveFile}
            className="dropzone col-md-6"
            multiple={false}
          />
        </div>
      </div>
      <div className="row form-group">
        <div className='col-md-6'>
          <label>{T.translate("email_flow_events_settings.email_template_ticket_top_graphic")}</label><br/>
          <UploadInput
            id="EMAIL_TEMPLATE_TICKET_TOP_GRAPHIC"
            value={_entity?.EMAIL_TEMPLATE_TICKET_TOP_GRAPHIC?.file_preview || _entity?.EMAIL_TEMPLATE_TICKET_TOP_GRAPHIC?.file}
            handleUpload={handleUploadFile}
            handleRemove={handleRemoveFile}
            className="dropzone col-md-6"
            multiple={false}
          />
        </div>
        <div className='col-md-6'>
          <label>{T.translate("email_flow_events_settings.email_template_ticket_bottom_graphic")}</label><br/>
          <UploadInput
            id="EMAIL_TEMPLATE_TICKET_BOTTOM_GRAPHIC"
            value={_entity?.EMAIL_TEMPLATE_TICKET_BOTTOM_GRAPHIC?.file_preview || _entity?.EMAIL_TEMPLATE_TICKET_BOTTOM_GRAPHIC?.file}
            handleUpload={handleUploadFile}
            handleRemove={handleRemoveFile}
            className="dropzone col-md-6"
            multiple={false}
          />
        </div>
      </div>

      <div className="row form-group">
        <div className='col-md-6'>
          <label>{T.translate("email_flow_events_settings.email_template_generic_from")}</label><br/>
          <Input
            id="EMAIL_TEMPLATE_GENERIC_FROM"
            value={_entity?.EMAIL_TEMPLATE_GENERIC_FROM?.value}
            onChange={handleChange}
            type="email"
            className="form-control"
            error={hasErrors('EMAIL_TEMPLATE_GENERIC_FROM', _errors)}
          />
        </div>
        <div className='col-md-6'>
          <label>{T.translate("email_flow_events_settings.email_template_speakers_from")}</label><br/>
          <Input
            id="EMAIL_TEMPLATE_SPEAKERS_FROM"
            value={_entity?.EMAIL_TEMPLATE_SPEAKERS_FROM?.value}
            onChange={handleChange}
            type="email"
            className="form-control"
            error={hasErrors('EMAIL_TEMPLATE_SPEAKERS_FROM', _errors)}
          />
        </div>
      </div>
      <div className="row form-group">
        <div className='col-md-6'>
          <label>{T.translate("email_flow_events_settings.email_template_primary_color")}</label><br/>
          <HexColorInput
            onChange={handleChange}
            id="EMAIL_TEMPLATE_PRIMARY_COLOR"
            value={_entity?.EMAIL_TEMPLATE_PRIMARY_COLOR?.value}
            className="form-control"/>
        </div>
        <div className='col-md-6'>
          <label>{T.translate("email_flow_events_settings.email_template_secondary_color")}</label><br/>
          <HexColorInput
            onChange={handleChange}
            id="EMAIL_TEMPLATE_SECONDARY_COLOR"
            value={_entity?.EMAIL_TEMPLATE_SECONDARY_COLOR?.value}
            className="form-control"/>
        </div>
      </div>

      <hr/>

      <div className="row">
        <div className="col-md-12 submit-buttons">
          <input type="button" onClick={handleSubmit}
                 className="btn btn-primary pull-right" value={T.translate("general.save")}/>
        </div>
      </div>
    </form>
  );
}

export default EmailFlowEventSettingsForm;
