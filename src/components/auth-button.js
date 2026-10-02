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
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const AuthButton = ({ isLoggedUser, doLogin, initLogOut, picture }) => {
  if (isLoggedUser) {
    return (
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<Avatar src={picture} sx={{ width: 24, height: 24 }} />}
        onClick={() => {
          initLogOut();
        }}
      >
        {T.translate("landing.sign_out")}
      </Button>
    );
  }

  return (
    <Box sx={{ mt: "60px", pt: "30px", pb: "50px", textAlign: "center" }}>
      <Typography sx={{ fontSize: 22, mb: 3 }}>
        {T.translate("landing.not_logged_in")}
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={() => {
          doLogin();
        }}
      >
        {T.translate("landing.log_in")}
      </Button>
    </Box>
  );
};

export default AuthButton;
