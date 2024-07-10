import React, {useRef} from "react";
import {Modal} from "react-bootstrap";
import T from "i18n-react";

import styles from './index.module.less';

const SendEmailModal = ({show, onHide, recipients, template, qty, testRecipient, onSend}) => {
  const excerptRef = useRef(null);

  const handleSend = () => {
    onSend(excerptRef.current.value);
  };

  return (
    <Modal show={show} onHide={onHide} backdrop={false} >
      <Modal.Header closeButton>
        <Modal.Title>
          {T.translate("send_emails_modal.title", {recipients})}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-12">
            {T.translate("send_emails_modal.warning", {template, qty, recipients})}
          </div>
          { testRecipient &&
            <div className="col-md-12">
              {T.translate("send_emails_modal.test_warning", {email: testRecipient})}
            </div>
          }
          <div className={`col-md-12 ${styles.excerptWrapper}`}>
            <label>{T.translate("send_emails_modal.excerpt_email")}</label><br/>
            <input className="form-control" ref={excerptRef}/>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-primary right-space" onClick={handleSend}>
          {T.translate("send_emails_modal.send_emails")}
        </button>
        <button className="btn btn-default" onClick={onHide}>
          {T.translate("general.cancel")}
        </button>
      </Modal.Footer>
    </Modal>
  )
}

export default SendEmailModal;