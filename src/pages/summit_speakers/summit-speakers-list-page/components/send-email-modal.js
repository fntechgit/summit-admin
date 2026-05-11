import React, { useState } from "react";
import T from "i18n-react";
import { connect } from "react-redux";
import Swal from "sweetalert2";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import Input from "openstack-uicore-foundation/lib/components/inputs/text-input";
import { Modal } from "react-bootstrap";
import { validateEmail } from "../../../../utils/methods";
import { SpeakersSources as sources } from "../../../../utils/constants";
import SpeakerPromoCodeSpecForm from "../../../../components/forms/speakers-promo-code-spec-form";
import {
  AUTO_GENERATED_SPEAKERS_DISCOUNT_CODE,
  AUTO_GENERATED_SPEAKERS_PROMO_CODE,
  EXISTING_SPEAKERS_DISCOUNT_CODE,
  EXISTING_SPEAKERS_PROMO_CODE
} from "../../../../actions/promocode-actions";
import {
  sendSpeakerEmails,
  setCurrentFlowEvent
} from "../../../../actions/speaker-actions";
import {
  sendSubmitterEmails,
  setCurrentSubmitterFlowEvent
} from "../../../../actions/submitter-actions";
import {
  resetPromoCodeSpecForm,
  validateSpecs
} from "../../../../actions/promocode-specification-actions";

const emailFlowSpeakersDDL = [
  { label: "-- SELECT EMAIL EVENT --", value: "" },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_ALTERNATE",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_ALTERNATE"
  },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_REJECTED",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_REJECTED"
  },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ALTERNATE_REJECTED",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ALTERNATE_REJECTED"
  },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_ONLY",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ACCEPTED_ONLY"
  },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ALTERNATE_ONLY",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_ALTERNATE_ONLY"
  },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_REJECTED_ONLY",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SPEAKER_REJECTED_ONLY"
  }
];
const emailFlowSubmittersDDL = [
  { label: "-- SELECT EMAIL EVENT --", value: "" },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_ALTERNATE",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_ALTERNATE"
  },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_REJECTED",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_REJECTED"
  },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ALTERNATE_REJECTED",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ALTERNATE_REJECTED"
  },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_ONLY",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ACCEPTED_ONLY"
  },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ALTERNATE_ONLY",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_ALTERNATE_ONLY"
  },
  {
    label: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_REJECTED_ONLY",
    value: "SUMMIT_SUBMISSIONS_PRESENTATION_SUBMITTER_REJECTED_ONLY"
  }
];

const promoCodeStrategiesDDL = [
  {
    label: T.translate("summit_speakers_list.select_promo_code_strategy"),
    value: 0
  },
  {
    label: T.translate("summit_speakers_list.select_speaker_promo_code"),
    value: EXISTING_SPEAKERS_PROMO_CODE
  },
  {
    label: T.translate("summit_speakers_list.select_speaker_discount_code"),
    value: EXISTING_SPEAKERS_DISCOUNT_CODE
  },
  {
    label: T.translate(
      "summit_speakers_list.select_auto_generate_speaker_promo_code"
    ),
    value: AUTO_GENERATED_SPEAKERS_PROMO_CODE
  },
  {
    label: T.translate(
      "summit_speakers_list.select_auto_generate_speaker_discount_code"
    ),
    value: AUTO_GENERATED_SPEAKERS_DISCOUNT_CODE
  }
];

const SendEmailModal = ({
  source,
  filterValues,
  speakersProps,
  submittersProps,
  currentSummit,
  currentPromocodeSpecification,
  setCurrentFlowEvent,
  setCurrentSubmitterFlowEvent,
  validateSpecs,
  resetPromoCodeSpecForm,
  sendSpeakerEmails,
  sendSubmitterEmails
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [promoCodeStrategy, setPromoCodeStrategy] = useState(null);
  const [testRecipient, setTestRecipient] = useState("");
  const [modalValues, setModalValues] = useState({
    ingest_email: "",
    should_send_copy_2_submitter: false
  });
  const isSpeakerMode = source === sources.speakers;
  const subjectProps = isSpeakerMode ? speakersProps : submittersProps;
  const { currentFlowEvent, selectedCount } = subjectProps;
  const emailFlowDDL = isSpeakerMode
    ? emailFlowSpeakersDDL
    : emailFlowSubmittersDDL;

  const handleOpenModal = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();

    if (!currentFlowEvent) {
      Swal.fire(
        "Validation error",
        T.translate("summit_speakers_list.select_template"),
        "warning"
      );
      return false;
    }

    if (selectedCount === 0) {
      const content =
        source === sources.speakers
          ? T.translate("summit_speakers_list.select_items")
          : T.translate("summit_submitters_list.select_items");
      Swal.fire("Validation error", content, "warning");
      return false;
    }

    if (testRecipient !== "" && !validateEmail(testRecipient)) {
      Swal.fire(
        "Validation error",
        T.translate("summit_speakers_list.invalid_recipient_email"),
        "warning"
      );
      return false;
    }

    setOpenModal(true);
    setModalValues({ ingest_email: "", should_send_copy_2_submitter: false });
  };

  const handleChangeFlowEvent = (ev) => {
    const { value } = ev.target;
    if (isSpeakerMode) {
      setCurrentFlowEvent(value);
    } else {
      setCurrentSubmitterFlowEvent(value);
    }
  };

  const handleChangePromoCodeStrategy = (ev) => {
    const { value } = ev.target;
    setPromoCodeStrategy(value);
    resetPromoCodeSpecForm();
  };

  const handleChangeTestRecipient = (ev) => {
    const { value } = ev.target;
    setTestRecipient(value);
  };

  const handleModalChange = (ev) => {
    const { id, value, checked } = ev.target;
    setModalValues({
      ...modalValues,
      [id]: checked || value
    });
  };

  const onValidationSuccess = () => {
    const {
      ingest_email: excerptRecipient,
      should_send_copy_2_submitter: sendCopy
    } = modalValues;
    const shouldSendCopy2Submitter = isSpeakerMode && sendCopy;
    const { term } = subjectProps;

    setOpenModal(false);
    setTestRecipient("");
    setPromoCodeStrategy(null);
    setModalValues({ ingest_email: "", should_send_copy_2_submitter: false });

    // send emails
    const sendEmails = isSpeakerMode ? sendSpeakerEmails : sendSubmitterEmails;

    sendEmails(
      term,
      filterValues,
      testRecipient,
      excerptRecipient,
      shouldSendCopy2Submitter,
      source,
      promoCodeStrategy,
      currentPromocodeSpecification.entity
    );
  };

  const handleSendEmails = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();

    validateSpecs(
      promoCodeStrategy,
      currentPromocodeSpecification.entity,
      onValidationSuccess
    );
  };

  return (
    <>
      <div className="row">
        <div className="col-md-6 speaker-list-email-col">
          <Dropdown
            id="activityTypeFilter"
            value={currentFlowEvent}
            onChange={handleChangeFlowEvent}
            options={emailFlowDDL}
            isClearable
          />
        </div>
        <div className="col-md-4 speaker-list-email-col">
          <Input
            value={testRecipient}
            onChange={handleChangeTestRecipient}
            placeholder={T.translate(
              "summit_speakers_list.placeholders.test_recipient"
            )}
          />
        </div>
        <div className="col-md-2 speaker-list-email-col">
          <button
            className="btn btn-default right-space"
            onClick={handleOpenModal}
          >
            {T.translate("summit_speakers_list.send_emails")}
          </button>
        </div>
      </div>
      <Modal
        show={openModal}
        onHide={() => setOpenModal(false)}
        backdrop={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {isSpeakerMode
              ? T.translate("summit_speakers_list.send_emails_title")
              : T.translate("summit_submitters_list.send_emails_title")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-12">
              {T.translate("summit_speakers_list.send_email_warning", {
                template: currentFlowEvent,
                qty: selectedCount
              })}
            </div>
            {testRecipient !== "" && (
              <div className="col-md-12">
                {T.translate("summit_speakers_list.email_test_recipient", {
                  email: testRecipient
                })}
              </div>
            )}
            <div className="col-md-12" style={{ paddingTop: "15px" }}>
              <label>
                {T.translate("summit_speakers_list.promo_code_strategy")}
              </label>
              <br />
              <Dropdown
                id="promoCodeStrategySelector"
                value={promoCodeStrategy}
                onChange={handleChangePromoCodeStrategy}
                options={promoCodeStrategiesDDL}
                isClearable
              />
            </div>
            <div className="col-md-12">
              <SpeakerPromoCodeSpecForm
                promoCodeStrategy={promoCodeStrategy}
                summit={currentSummit}
                entity={currentPromocodeSpecification.entity}
                errors={currentPromocodeSpecification.errors}
              />
            </div>
            <div
              className="col-md-12 ticket-ingest-email-wrapper"
              style={{ paddingTop: "5px" }}
            >
              <label>{T.translate("summit_speakers_list.excerpt_email")}</label>
              <br />
              <input
                id="ingest_email"
                className="form-control"
                onChange={handleModalChange}
              />
            </div>
            {isSpeakerMode && (
              <div
                className="col-md-12 ticket-ingest-email-wrapper"
                style={{ paddingTop: "3px" }}
              >
                <div className="form-check abc-checkbox">
                  <input
                    id="should_send_copy_2_submitter"
                    className="form-check-input"
                    type="checkbox"
                    onChange={handleModalChange}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="should_send_copy_2_submitter"
                  >
                    {T.translate(
                      "summit_speakers_list.should_send_copy_2_submitter"
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-primary right-space"
            onClick={handleSendEmails}
          >
            {T.translate("summit_speakers_list.send_emails")}
          </button>
          <button
            className="btn btn-default"
            onClick={() => setOpenModal(false)}
          >
            {T.translate("general.cancel")}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentSummitSpeakersListState,
  currentSummitSubmittersListState,
  currentPromocodeSpecificationState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  speakersProps: currentSummitSpeakersListState,
  submittersProps: currentSummitSubmittersListState,
  currentPromocodeSpecification: currentPromocodeSpecificationState
});

export default connect(mapStateToProps, {
  setCurrentFlowEvent,
  sendSpeakerEmails,
  setCurrentSubmitterFlowEvent,
  sendSubmitterEmails,
  validateSpecs,
  resetPromoCodeSpecForm
})(SendEmailModal);
