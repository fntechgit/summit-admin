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
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/es/integration/react";
import App from "./app";
import store, { persistor } from "./store";
import "font-awesome/css/font-awesome.css";
import "./styles/landing.css";
import "./styles/general.less";
import "openstack-uicore-foundation/lib/css/components/index.css";
import CustomTheme from "./components/CustomTheme";
import SnackbarNotification from "./components/mui/components/SnackbarNotification";

const onBeforeLift = () => {
  console.log("reading state ...");
};

ReactDOM.render(
  <Provider store={store}>
    <PersistGate onBeforeLift={onBeforeLift} persistor={persistor}>
      <CustomTheme>
        <SnackbarNotification>
          <App />
        </SnackbarNotification>
      </CustomTheme>
    </PersistGate>
  </Provider>,
  document.querySelector("#root")
);
