import React, {useState} from "react";
import T from "i18n-react";
import {Modal} from "react-bootstrap";
import {UploadInput} from "openstack-uicore-foundation/lib/components";


const ImportPromocodesBtn = ({onImport, showSpeakers = true, showSponsorId = false, showContactEmail = false, allowedClasses=[]}) => {
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleImport = () => {
    if (file) {
      onImport(file);
    }

    setFile(null);
    setShowModal(false);
  }


  return (
    <>
      <button className="btn btn-default" onClick={() => setShowModal(true)}>
        {T.translate("promocode_list.import")}
      </button>

      <Modal show={showModal} onHide={() => setShowModal(false)} >
        <Modal.Header closeButton>
          <Modal.Title>{T.translate("promocode_list.import_promocodes")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-12">
              File must be a CSV file the following format:<br />
              <ul>
                <li><b>code:</b> text</li>
                <li><b>class_name:</b> text {allowedClasses.length ? `(${allowedClasses.join(',')})`:''}</li>
                <li><b>quantity_available:</b> int</li>
                <li><b>badge_features:</b> list of badge feature ids pipe delimited (optional)</li>
                <li><b>allowed_tickets_types:</b> list of allowed ticket type ids pipe delimited (optional)</li>
                {showSpeakers && <li><b>speaker_ids:</b> list of badge speaker ids pipe delimited (optional)</li>}
                {showSponsorId && <li><b>sponsor_id:</b> id of the sponsor (optional)</li>}
                {showContactEmail && <li><b>contact_email:</b> contact email for the promo code (optional)</li>}
              </ul>
            </div>
            <div className="col-md-12 ticket-import-upload-wrapper">
              <UploadInput
                value={file?.name}
                handleUpload={(file) => setFile(file)}
                handleRemove={() => setFile(null)}
                className="dropzone col-md-6"
                multiple={false}
                accept=".csv"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button disabled={!file} className="btn btn-primary" onClick={handleImport}>
            {T.translate("promocode_list.ingest")}
          </button>
        </Modal.Footer>
      </Modal>

    </>
  );
}

export default ImportPromocodesBtn;
