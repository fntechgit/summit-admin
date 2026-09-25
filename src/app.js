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
import { Switch, Route, Router } from "react-router-dom";
import { connect } from "react-redux";
import { setAppTexts } from "openstack-uicore-foundation/lib/i18n";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import { getBackURL } from "openstack-uicore-foundation/lib/utils/methods";
import { resetLoading } from "openstack-uicore-foundation/lib/utils/actions";
import {
  doLogout,
  onUserAuth,
  getUserInfo
} from "openstack-uicore-foundation/lib/security/actions";
import {
  initLogOut,
  doLoginBasicLogin,
  getIdToken
} from "openstack-uicore-foundation/lib/security/methods";
import IdTokenVerifier from "idtoken-verifier";
import T from "i18n-react";
import { Breadcrumbs } from "react-breadcrumbs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
// eslint-disable-next-line
import * as Sentry from "@sentry/react";
import exclusiveSections from "./exclusive-sections.yml";
import CustomErrorPage from "./pages/custom-error-page";
import history from "./history";
import PrimaryLayout from "./layouts/primary-layout";
import AuthorizedRoute from "./routes/authorized-route";
import AuthorizationCallbackRoute from "./routes/authorization-callback-route";
import LogOutCallbackRoute from "./routes/logout-callback-route";
import AuthButton from "./components/auth-button";
import DefaultRoute from "./routes/default-route";
import { getTimezones } from "./actions/base-actions";
import {
  ALLOWED_INVENTORY_IMAGE_FORMATS,
  LANGUAGE_CODE_LENGTH
} from "./utils/constants";
import { SentryFallbackFunction } from "./components/SentryErrorComponent";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// here is set by default user lang as en
let language =
  (navigator.languages && navigator.languages[0]) ||
  navigator.language ||
  navigator.userLanguage;

// language would be something like es-ES or es_ES
// However we store our files with format es.json or en.json
// therefore retrieve only the first 2 digits

if (language.length > LANGUAGE_CODE_LENGTH) {
  language = language.split("-")[0];
  language = language.split("_")[0];
}

// DISABLED language - ONLY ENGLISH
// use this method so that uicore translations are not overridden
setAppTexts(require("./i18n/en.json"));

// move all env var to global scope so ui core has access to this

window.IDP_BASE_URL = process.env.IDP_BASE_URL;
window.API_BASE_URL = process.env.API_BASE_URL;
window.AUDIT_LOG_API_BASE_URL =
  process.env.AUDIT_LOG_API_BASE_URL || window.API_BASE_URL;
window.REPORT_API_BASE_URL = process.env.REPORT_API_BASE_URL;
window.MARKETING_API_BASE_URL = process.env.MARKETING_API_BASE_URL;
window.EMAIL_API_BASE_URL = process.env.EMAIL_API_BASE_URL;
window.PURCHASES_API_URL = process.env.PURCHASES_API_URL;
window.SPONSOR_USERS_API_URL = process.env.SPONSOR_USERS_API_URL;
window.SPONSOR_PAGES_API_URL = process.env.SPONSOR_PAGES_API_URL;
window.SPONSOR_REPORTS_API_URL = process.env.SPONSOR_REPORTS_API_URL;
window.FILE_UPLOAD_API_BASE_URL = process.env.FILE_UPLOAD_API_BASE_URL;
window.SIGNAGE_BASE_URL = process.env.SIGNAGE_BASE_URL;
window.INVENTORY_API_BASE_URL = process.env.INVENTORY_API_BASE_URL;
window.OAUTH2_CLIENT_ID = process.env.OAUTH2_CLIENT_ID;
window.SCOPES = process.env.SCOPES;
window.ALLOWED_USER_GROUPS = process.env.ALLOWED_USER_GROUPS;
window.EXCLUSIVE_SECTIONS = [];
window.PUBLIC_STORAGES = process.env.PUBLIC_STORAGES || "S3";
window.CHAT_API_BASE_URL = process.env.CHAT_API_BASE_URL;
window.PUB_API_BASE_URL = process.env.PUB_API_BASE_URL;
window.APP_CLIENT_NAME = process.env.APP_CLIENT_NAME;
window.OAUTH2_FLOW = process.env.OAUTH2_FLOW || "token id_token";
window.PERSIST_FILTER_CRITERIA_API = process.env.PERSIST_FILTER_CRITERIA_API;
window.SENTRY_DSN = process.env.SENTRY_DSN;
window.SENTRY_TRACE_SAMPLE_RATE = process.env.SENTRY_TRACE_SAMPLE_RATE;
window.SENTRY_TRACE_PROPAGATION_TARGETS =
  process.env.SENTRY_TRACE_PROPAGATION_TARGETS;
window.CFP_APP_BASE_URL = process.env.CFP_APP_BASE_URL;
window.CFP_MAX_REOPEN_HOURS = process.env.CFP_MAX_REOPEN_HOURS;
window.DROPBOX_MATERIALIZER_API_BASE_URL =
  process.env.DROPBOX_MATERIALIZER_API_BASE_URL;
window.FILE_UPLOAD_ALLOWED_EXTENSIONS =
  process.env.FILE_UPLOAD_ALLOWED_EXTENSIONS ||
  ALLOWED_INVENTORY_IMAGE_FORMATS.join(",");

if (exclusiveSections.hasOwnProperty(process.env.APP_CLIENT_NAME)) {
  window.EXCLUSIVE_SECTIONS = exclusiveSections[process.env.APP_CLIENT_NAME];
}

const MENU_CLOSE_DELAY_MS = 200;
const HOVER_OPEN_CLICK_GRACE_MS = 300;

if (window.SENTRY_DSN && window.SENTRY_DSN !== "") {
  console.log("app init sentry ...");
  // Initialize Sentry
  Sentry.init({
    dsn: window.SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.browserProfilingIntegration(),
      Sentry.replayIntegration()
    ],
    // Tracing
    tracesSampleRate: window.SENTRY_TRACE_SAMPLE_RATE, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: [window.SENTRY_TRACE_PROPAGATION_TARGETS],
    // Set profilesSampleRate to 1.0 to profile every transaction.
    // Since profilesSampleRate is relative to tracesSampleRate,
    // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
    // For example, a tracesSampleRate of 0.5 and profilesSampleRate of 0.5 would
    // results in 25% of transactions being profiled (0.5*0.5=0.25)
    profilesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

class App extends React.PureComponent {
  constructor(props) {
    super(props);
    props.resetLoading();
    this.state = { menuOpen: false, openedByHover: false };
    this.menuCloseTimeout = null;
    this.lastHoverOpen = 0;
    this.toggleMenu = this.toggleMenu.bind(this);
    this.openMenu = this.openMenu.bind(this);
    this.cancelMenuClose = this.cancelMenuClose.bind(this);
    this.scheduleMenuClose = this.scheduleMenuClose.bind(this);
  }

  onClickLogin() {
    doLoginBasicLogin(getBackURL());
  }

  componentDidMount() {
    this.props.getTimezones();
    // A client-side route change does not reset scroll, so navigating from a
    // scrolled list used to land mid-page. POP is excluded so back/forward
    // keeps the position the browser restores.
    this.unlistenHistory = history.listen((location, action) => {
      if (action === "PUSH") window.scrollTo(0, 0);
    });
  }

  componentWillUnmount() {
    this.cancelMenuClose();
    if (this.unlistenHistory) this.unlistenHistory();
  }

  toggleMenu() {
    this.cancelMenuClose();
    if (Date.now() - this.lastHoverOpen < HOVER_OPEN_CLICK_GRACE_MS) return;
    this.setState((prevState) => ({
      menuOpen: !prevState.menuOpen,
      openedByHover: false
    }));
  }

  openMenu() {
    this.cancelMenuClose();
    this.lastHoverOpen = Date.now();
    this.setState({ menuOpen: true, openedByHover: true });
  }

  cancelMenuClose() {
    if (this.menuCloseTimeout) {
      clearTimeout(this.menuCloseTimeout);
      this.menuCloseTimeout = null;
    }
  }

  scheduleMenuClose() {
    this.cancelMenuClose();
    this.menuCloseTimeout = setTimeout(() => {
      this.setState({ menuOpen: false });
    }, MENU_CLOSE_DELAY_MS);
  }

  render() {
    const {
      isLoggedUser,
      onUserAuth,
      doLogout,
      getUserInfo,
      backUrl,
      loading
    } = this.props;
    const { menuOpen, openedByHover } = this.state;

    const idToken = getIdToken();

    // get user pic from idtoken claims (IDP)
    let profile_pic = "";

    if (idToken) {
      const verifier = new IdTokenVerifier({
        issuer: window.IDP_BASE_URL,
        audience: window.OAUTH2_CLIENT_ID
      });
      const jwt = verifier.decode(idToken);
      profile_pic = jwt.payload.picture;
    }

    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

    return (
      <Sentry.ErrorBoundary
        fallback={SentryFallbackFunction({ componentName: "Summit Admin App" })}
      >
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <Router history={history}>
            <div>
              <AjaxLoader show={loading} size={120} />
              <AppBar
                position="sticky"
                id="page-header"
                className="header"
                elevation={0}
                sx={{
                  bgcolor: "background.paper",
                  color: "text.primary",
                  borderBottom: "1px solid #b3b3b3"
                }}
              >
                <Toolbar
                  sx={{
                    minHeight: { xs: 48, sm: 56 },
                    // Short viewports (landscape phones) get the compact bar;
                    // keyed off height so desktop, which is also landscape, keeps
                    // the sm value.
                    "@media (max-height:500px)": { minHeight: 48 }
                  }}
                >
                  {isLoggedUser && (
                    <IconButton
                      edge="start"
                      aria-label={T.translate("menu.toggle_navigation")}
                      onClick={this.toggleMenu}
                      {...(canHover && {
                        onMouseEnter: this.openMenu,
                        onMouseLeave: this.scheduleMenuClose
                      })}
                      sx={{ mr: 2 }}
                    >
                      <MenuIcon
                        sx={{ fontSize: "1.75rem", color: "#555555" }}
                      />
                    </IconButton>
                  )}
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      flexGrow: 1,
                      ...(!isLoggedUser && { textAlign: "center" })
                    }}
                  >
                    {T.translate("landing.os_summit_admin")}
                  </Typography>
                  {isLoggedUser && (
                    <AuthButton
                      isLoggedUser={isLoggedUser}
                      picture={profile_pic}
                      doLogin={this.onClickLogin.bind(this)}
                      initLogOut={initLogOut}
                    />
                  )}
                </Toolbar>
              </AppBar>
              {/* Outside the AppBar so it scrolls away, not pinned */}
              {isLoggedUser && (
                <Toolbar
                  variant="dense"
                  sx={{
                    minHeight: 36,
                    bgcolor: "background.paper",
                    borderBottom: "1px solid #e0e0e0",
                    overflowX: "auto"
                  }}
                >
                  <Breadcrumbs className="breadcrumbs-wrapper" separator="/" />
                </Toolbar>
              )}
              {!isLoggedUser && (
                <AuthButton
                  isLoggedUser={isLoggedUser}
                  picture={profile_pic}
                  doLogin={this.onClickLogin.bind(this)}
                  initLogOut={initLogOut}
                />
              )}
              <Switch>
                <AuthorizedRoute
                  isLoggedUser={isLoggedUser}
                  backUrl={backUrl}
                  path="/app"
                  component={PrimaryLayout}
                  componentProps={{
                    menuOpen,
                    openedByHover,
                    toggleMenu: this.toggleMenu,
                    onMenuMouseEnter: this.cancelMenuClose,
                    onMenuMouseLeave: this.scheduleMenuClose
                  }}
                />
                <AuthorizationCallbackRoute
                  onUserAuth={onUserAuth}
                  path="/auth/callback"
                  getUserInfo={getUserInfo}
                />
                <LogOutCallbackRoute doLogout={doLogout} path="/auth/logout" />
                <Route path="/logout" render={() => <p>404 - Not Found</p>} />
                <Route path="/404" render={() => <p>404 - Not Found</p>} />
                <Route path="/error" component={CustomErrorPage} />
                <DefaultRoute isLoggedUser={isLoggedUser} />
              </Switch>
            </div>
          </Router>
        </LocalizationProvider>
      </Sentry.ErrorBoundary>
    );
  }
}

const mapStateToProps = ({ loggedUserState, baseState }) => ({
  isLoggedUser: loggedUserState.isLoggedUser,
  backUrl: loggedUserState.backUrl,
  member: loggedUserState.member,
  loading: baseState.loading
});

export default connect(mapStateToProps, {
  onUserAuth,
  doLogout,
  getUserInfo,
  resetLoading,
  getTimezones
})(App);
