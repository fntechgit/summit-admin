/**
 * Copyright 2019 OpenStack Foundation
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
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import Swal from "sweetalert2";
import { Modal } from "react-bootstrap";
import QrReader from "../qr-reader";

export default class QrReaderInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false
    };

    this.handleScan = this.handleScan.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  handleScan(data) {
    const { onScan } = this.props;
    if (data) {
      this.setState({ showModal: false });
      onScan(data);
    }
  }

  handleError(err) {
    this.setState({ showModal: false });

    Swal.fire({
      title: "Error",
      text: "cannot read QR code, please try again",
      type: "warning"
    });
  }

  render() {
    const { showModal } = this.state;

    return (
      <div>
        <button
          className="btn btn-default"
          type="button"
          onClick={() => {
            this.setState({ showModal: true });
          }}
        >
          Scan QR
        </button>

        <Modal
          show={showModal}
          onHide={() => {
            this.setState({ showModal: false });
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title>Scan QR</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <QrReader onError={this.handleError} onScan={this.handleScan} />
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}
