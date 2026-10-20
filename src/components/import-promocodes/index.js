import React, { useState } from "react";
import T from "i18n-react";
import Button from "@mui/material/Button";
import ImportModal from "../inputs/import-modal";

const ImportPromocodesBtn = ({
  onImport,
  showSpeakers = true,
  showSponsorId = false,
  showContactEmail = false,
  allowedClasses = []
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleImport = (file) => {
    if (file) {
      onImport(file);
    }

    setShowModal(false);
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setShowModal(true)}>
        {T.translate("promocode_list.import")}
      </Button>
      <ImportModal
        title={T.translate("promocode_list.import_promocodes")}
        show={showModal}
        onHide={() => setShowModal(false)}
        onIngest={handleImport}
      >
        <ul>
          <li>
            <b>code:</b> text
          </li>
          <li>
            <b>class_name:</b> text{" "}
            {allowedClasses.length ? `(${allowedClasses.join(",")})` : ""}
          </li>
          <li>
            <b>quantity_available:</b> int
          </li>
          <li>
            <b>badge_features:</b> list of badge feature ids pipe delimited
            (optional)
          </li>
          <li>
            <b>allowed_ticket_types:</b> list of allowed ticket type ids pipe
            delimited (optional)
          </li>
          {showSpeakers && (
            <li>
              <b>speaker_ids:</b> list of badge speaker ids pipe delimited
              (optional)
            </li>
          )}
          {showSponsorId && (
            <li>
              <b>sponsor_id:</b> id of the sponsor (optional)
            </li>
          )}
          {showContactEmail && (
            <li>
              <b>contact_email:</b> contact email for the promo code (optional)
            </li>
          )}
          <li>
            <b>notes:</b> text (optional)
          </li>
          <li>
            <b>allows_to_reassign:</b> true/false (optional, default true)
          </li>
          <li>
            <b>allows_to_delegate:</b> true/false (optional, default true)
          </li>
        </ul>
      </ImportModal>
    </>
  );
};

export default ImportPromocodesBtn;
