import React, { useState } from "react";
import { Dropdown, Input } from "openstack-uicore-foundation/lib/components";
import Swal from "sweetalert2";
import T from "i18n-react";
import { Modal } from "react-bootstrap";
import { validateEmail } from "../../utils/methods";

const EventRSVPInvitationBlast = ({
  children,
  selectedCount,
  currentEmailTemplate,
  onBlastInvitations,
  setCurrentEmailTemplate
}) => {
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [excerptRecipient, setExcerptRecipient] = useState("");
  const [showBlastModal, setShowBlastModal] = useState(false);

  const handleDisplayBlastModal = () => {
    if (!currentEmailTemplate) {
      Swal.fire(
        "Validation error",
        T.translate("event_rsvp_list.select_template"),
        "warning"
      );
      return false;
    }

    if (selectedCount === 0) {
      Swal.fire(
        "Validation error",
        T.translate("event_rsvp_list.select_items"),
        "warning"
      );
      return false;
    }

    if (testEmailRecipient !== "" && !validateEmail(testEmailRecipient)) {
      Swal.fire(
        "Validation error",
        T.translate("event_rsvp_list.invalid_recipient_email"),
        "warning"
      );
      return false;
    }

    setExcerptRecipient("");
    setShowBlastModal(true);
  };

  const handleBlastInvitations = () => {
    onBlastInvitations(testEmailRecipient, excerptRecipient);
    setShowBlastModal(false);
  };

  const handleEmailTemplateChange = (ev) => {
    setCurrentEmailTemplate(ev.target.value);
  };

  const emailTemplateDDL = [
    { label: "-- SELECT EMAIL EVENT --", value: "" },
    {
      label: "SUMMIT_REGISTRATION_INVITE_RSVP",
      value: "SUMMIT_REGISTRATION_INVITE_RSVP"
    },
    {
      label: "SUMMIT_REGISTRATION_REINVITE_RSVP",
      value: "SUMMIT_REGISTRATION_REINVITE_RSVP"
    }
  ];

  return (
    <>
      <div className="row form-group">
        <div className="col-md-4">
          <Dropdown
            id="current_email_template"
            value={currentEmailTemplate}
            onChange={handleEmailTemplateChange}
            options={emailTemplateDDL}
          />
        </div>
        <div className="col-md-3">
          <Input
            id="test_email_recipient"
            value={testEmailRecipient}
            onChange={(ev) => setTestEmailRecipient(ev.target.value)}
            placeholder={T.translate(
              "event_rsvp_list.placeholders.test_recipient"
            )}
            className="form-control"
          />
        </div>
        <div className="col-md-5">
          {children}
          <button
            className="btn btn-primary pull-right"
            type="button"
            onClick={handleDisplayBlastModal}
          >
            {T.translate("event_rsvp_list.send_blast")}
          </button>
        </div>
      </div>

      <Modal show={showBlastModal} onHide={() => setShowBlastModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {T.translate("event_rsvp_list.blast_modal_title")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-12">
              {T.translate("event_rsvp_list.send_email_warning", {
                template: currentEmailTemplate,
                qty: selectedCount
              })}
            </div>
            <div className="col-md-12 acceptance-criteria-wrapper">
              <label htmlFor="excerpt_recipient">
                {T.translate("event_rsvp_list.excerpt_recipient")}
              </label>
              <Input
                id="test_email_recipient"
                value={excerptRecipient}
                onChange={(ev) => setExcerptRecipient(ev.target.value)}
                placeholder={T.translate(
                  "event_rsvp_list.placeholders.test_recipient"
                )}
                className="form-control"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-primary" onClick={handleBlastInvitations}>
            {T.translate("event_rsvp_list.send_emails")}
          </button>
          <button
            className="btn btn-default"
            onClick={() => setShowBlastModal(false)}
          >
            {T.translate("general.cancel")}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EventRSVPInvitationBlast;
