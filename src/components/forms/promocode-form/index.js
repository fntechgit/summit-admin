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
 * */

import React from "react";
import T from "i18n-react/dist/i18n-react";
import * as yup from "yup";
import { useFormikContext } from "formik";
import { Grid2, InputLabel, MenuItem } from "@mui/material";
import MuiFormikSelect from "openstack-uicore-foundation/lib/components/mui/formik-inputs/select";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  SpeakerPCForm,
  MemberPCForm,
  SponsorPCForm,
  MemberDiscountPCForm,
  SpeakerDiscountPCForm,
  SponsorDiscountPCForm,
  SummitPCForm,
  SummitDiscountPCForm,
  SpeakersPCForm,
  SpeakersDiscountPCForm,
  DomainAuthorizedPCForm,
  DomainAuthorizedDiscountPCForm
} from "./forms";
import {
  dateToShowTZEpoch,
  validateAllowedEmailDomainEntry
} from "../../../utils/methods";
import { isDomainAuthorizedClass } from "./forms/domain-authorized/utils";
import AllowedEmailDomainsRow from "./forms/domain-authorized/AllowedEmailDomainsRow";
import AutoApplyCheckbox from "./forms/auto-apply-checkbox";
import { formatSpeakerOption } from "./forms/speaker-base-pc-form";
import CheckboxWithInfo from "./forms/checkbox-with-info";
import TagsInput from "./forms/tags-input";
import { DEFAULT_ENTITY } from "../../../reducers/promocodes/promocode-reducer";
import FragmentParser from "../../../utils/fragmen-parser";

const DESCRIPTION_MAX_LENGTH = 255;

const CLASS_FORMS = {
  SPEAKER_PROMO_CODE: SpeakerPCForm,
  SPONSOR_PROMO_CODE: SponsorPCForm,
  MEMBER_PROMO_CODE: MemberPCForm,
  SPEAKER_DISCOUNT_CODE: SpeakerDiscountPCForm,
  SPONSOR_DISCOUNT_CODE: SponsorDiscountPCForm,
  MEMBER_DISCOUNT_CODE: MemberDiscountPCForm,
  SUMMIT_PROMO_CODE: SummitPCForm,
  PRE_PAID_PROMO_CODE: SummitPCForm,
  SUMMIT_DISCOUNT_CODE: SummitDiscountPCForm,
  PRE_PAID_DISCOUNT_CODE: SummitDiscountPCForm,
  SPEAKERS_PROMO_CODE: SpeakersPCForm,
  SPEAKERS_DISCOUNT_CODE: SpeakersDiscountPCForm,
  DOMAIN_AUTHORIZED_PROMO_CODE: DomainAuthorizedPCForm,
  DOMAIN_AUTHORIZED_DISCOUNT_CODE: DomainAuthorizedDiscountPCForm
};

const toMoment = (epoch, timezone) =>
  epoch ? epochToMomentTimeZone(epoch, timezone) : null;

// speakers, ticket_types_rules, email_sent, redeemed and quantity_used are saved by their own endpoints, so they stay in redux
export const buildPromocodeValues = (entity, summit) => ({
  id: entity.id,
  class_name: entity.class_name ?? "",
  type: entity.type ?? "",
  code: entity.code ?? "",
  tags: entity.tags ?? [],
  description: entity.description ?? "",
  allows_to_delegate: !!entity.allows_to_delegate,
  allows_to_reassign: !!entity.allows_to_reassign,
  auto_apply: !!entity.auto_apply,
  allowed_email_domains: entity.allowed_email_domains ?? [],
  quantity_per_account: entity.quantity_per_account ?? 0,
  email: entity.owner?.email ?? entity.email ?? "",
  first_name: entity.owner?.first_name ?? entity.first_name ?? "",
  last_name: entity.owner?.last_name ?? entity.last_name ?? "",
  speaker:
    entity.speaker && typeof entity.speaker === "object"
      ? formatSpeakerOption(entity.speaker)
      : null,
  sponsor: entity.sponsor?.id
    ? {
        id: entity.sponsor.id,
        name: entity.sponsor.company?.name ?? entity.sponsor.name
      }
    : null,
  contact_email: entity.contact_email ?? "",
  quantity_available: entity.quantity_available ?? 0,
  valid_since_date: toMoment(entity.valid_since_date, summit.time_zone_id),
  valid_until_date: toMoment(entity.valid_until_date, summit.time_zone_id),
  badge_features: (entity.badge_features ?? []).map((f) => f?.id ?? f),
  badge_features_apply_to_all_tix_retroactively:
    !!entity.badge_features_apply_to_all_tix_retroactively,
  notes: entity.notes ?? "",
  allowed_ticket_types: (entity.allowed_ticket_types ?? []).map((tt) => ({
    value: tt.id,
    label: tt.name
  })),
  apply_to_all_tix: !!entity.apply_to_all_tix,
  amount: entity.amount ?? "",
  rate: entity.rate ?? ""
});

// rebuilds the entity shape normalizeEntity expects in savePromocode
export const toPromocodeEntity = (values, entity, summit) => {
  const { email, first_name, last_name, ...rest } = values;
  return {
    ...entity,
    ...rest,
    email,
    first_name,
    last_name,
    owner: { email, first_name, last_name },
    speaker: values.speaker?.raw ?? null,
    allowed_ticket_types: values.allowed_ticket_types.map((tt) => tt.value),
    valid_since_date: values.valid_since_date
      ? dateToShowTZEpoch(values.valid_since_date, summit.time_zone_id)
      : "",
    valid_until_date: values.valid_until_date
      ? dateToShowTZEpoch(values.valid_until_date, summit.time_zone_id)
      : ""
  };
};

export const promocodeValidationSchema = yup.object({
  contact_email: yup.string().email(T.translate("validation.email")),
  allowed_email_domains: yup.array().when("class_name", {
    is: isDomainAuthorizedClass,
    then: (schema) =>
      schema.test(
        "allowed-email-domains-format",
        T.translate("edit_promocode.errors.allowed_email_domains_format"),
        (domains = []) => domains.every(validateAllowedEmailDomainEntry)
      )
  })
});

const fragmentParser = new FragmentParser();

const PromocodeForm = ({
  entity,
  currentSummit,
  allClasses,
  onSendEmail,
  assignSpeaker,
  getAssignedSpeakers,
  unAssignSpeaker
}) => {
  const { values, setValues, setTouched } = useFormikContext();
  const isDomainAuthorized = isDomainAuthorizedClass(values.class_name);
  const isNew = !values.id;
  const typeScope = fragmentParser.getParam("type");

  const classOptions = allClasses
    .map((c) => c.class_name)
    .filter((c) => typeScope !== "sponsor" || c.includes("SPONSOR"));
  const typeOptions =
    allClasses.find((c) => c.class_name === values.class_name)?.type ?? [];

  const handleClassChange = (ev) => {
    setTouched({});
    setValues({
      ...buildPromocodeValues(DEFAULT_ENTITY, currentSummit),
      class_name: ev.target.value
    });
  };

  const ClassForm = CLASS_FORMS[values.class_name];

  return (
    <Grid2 container spacing={2} size={12} sx={{ p: 3 }}>
      <Grid2 size={3}>
        <InputLabel htmlFor="class_name">
          {T.translate("edit_promocode.class_name")} *
        </InputLabel>
        <MuiFormikSelect
          name="class_name"
          placeholder={T.translate(
            "edit_promocode.placeholders.select_class_name"
          )}
          onChange={handleClassChange}
          disabled={!isNew}
        >
          {classOptions.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </MuiFormikSelect>
      </Grid2>
      {typeOptions.length > 0 && (
        <Grid2 size={3}>
          <InputLabel htmlFor="type">
            {T.translate("edit_promocode.type")} *
          </InputLabel>
          <MuiFormikSelect
            name="type"
            placeholder={T.translate("promocode_list.placeholders.select_type")}
            disabled={!isNew}
          >
            {typeOptions.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </MuiFormikSelect>
        </Grid2>
      )}
      <Grid2 size={3}>
        <InputLabel htmlFor="code">
          {T.translate("edit_promocode.code")} *
        </InputLabel>
        <MuiFormikTextField name="code" margin="none" fullWidth />
      </Grid2>
      <Grid2 size={3}>
        <InputLabel htmlFor="tags">
          {T.translate("edit_promocode.tags")}
        </InputLabel>
        <TagsInput
          name="tags"
          placeholder={T.translate("edit_promocode.placeholders.select_tags")}
        />
      </Grid2>

      {isDomainAuthorized && (
        <Grid2 size={12}>
          <AllowedEmailDomainsRow />
        </Grid2>
      )}

      <Grid2 size={8}>
        <InputLabel htmlFor="description">
          {T.translate("edit_promocode.description")}
        </InputLabel>
        <MuiFormikTextField
          name="description"
          margin="none"
          fullWidth
          multiline
          rows={4}
          maxLength={DESCRIPTION_MAX_LENGTH}
        />
      </Grid2>
      <Grid2 size={4}>
        <CheckboxWithInfo
          name="allows_to_delegate"
          label={T.translate("edit_promocode.allows_to_delegate")}
          info={T.translate("edit_promocode.allows_to_delegate_info")}
        />
        <CheckboxWithInfo
          name="allows_to_reassign"
          label={T.translate("edit_promocode.allows_to_reassign")}
          info={T.translate("edit_promocode.allows_to_reassign_info")}
        />
        {isDomainAuthorized && <AutoApplyCheckbox withCaption />}
      </Grid2>

      {ClassForm && (
        <ClassForm
          entity={entity}
          summit={currentSummit}
          onSendEmail={onSendEmail}
          assignSpeaker={assignSpeaker}
          getAssignedSpeakers={getAssignedSpeakers}
          unAssignSpeaker={unAssignSpeaker}
        />
      )}
    </Grid2>
  );
};

export default PromocodeForm;
