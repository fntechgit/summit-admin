/**
 * Copyright 2024 OpenStack Foundation
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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Grid2,
  IconButton,
  Paper,
  Typography
} from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockClosedIcon from "@mui/icons-material/Lock";
import AddIcon from "@mui/icons-material/Add";
import {
  deleteSponsorCartForm,
  getSponsorCart,
  lockSponsorCartForm,
  unlockSponsorCartForm
} from "../../../actions/sponsor-cart-actions";
import SearchInput from "../../../components/mui/search-input";
import { TotalRow } from "../../../components/mui/table/extra-rows";
import MuiTable from "../../../components/mui/table/mui-table";

const SponsorCartTab = ({
  cart,
  term,
  sponsor,
  summitId,
  getSponsorCart,
  deleteSponsorCartForm,
  lockSponsorCartForm,
  unlockSponsorCartForm
}) => {
  const [openPopup, setOpenPopup] = useState(null);
  const [formEdit, setFormEdit] = useState(null);

  useEffect(() => {
    getSponsorCart();
  }, []);

  const handleSearch = (searchTerm) => {
    getSponsorCart(searchTerm);
  };

  const handleManageItems = (item) => {
    console.log("MANAGE ITEMS : ", item);
  };

  const handleEdit = (item) => {
    setFormEdit(item);
  };

  const handleDelete = (itemId) => {
    deleteSponsorCartForm(itemId);
  };

  const handleLock = (form) => {
    if (form.is_locked) {
      unlockSponsorCartForm(form.form_id);
    } else {
      lockSponsorCartForm(form.form_id);
    }
  };

  const handlePayCreditCard = () => {
    console.log("PAY CREDIT CARD");
  };

  const handlePayInvoice = () => {
    console.log("PAY INVOICE");
  };

  const tableColumns = [
    {
      columnKey: "code",
      header: T.translate("edit_sponsor.cart_tab.code")
    },
    {
      columnKey: "name",
      header: T.translate("edit_sponsor.cart_tab.name")
    },
    {
      columnKey: "allowed_add_ons",
      header: T.translate("edit_sponsor.cart_tab.add_ons"),
      render: (row) =>
        row.allowed_add_ons?.length > 0
          ? row.allowed_add_ons.map((a) => `${a.type} ${a.name}`).join(", ")
          : "None"
    },
    {
      columnKey: "manage_items",
      header: "",
      width: 100,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="small"
          onClick={() => handleManageItems(row)}
        >
          {T.translate("edit_sponsor.cart_tab.manage_items")}
        </Button>
      )
    },
    {
      columnKey: "discount",
      header: T.translate("edit_sponsor.cart_tab.discount")
    },
    {
      columnKey: "amount",
      header: T.translate("edit_sponsor.cart_tab.amount")
    },
    {
      columnKey: "lock",
      header: "",
      render: (row) => (
        <IconButton size="large" onClick={() => handleLock(row)}>
          {row.is_locked ? (
            <LockClosedIcon fontSize="large" />
          ) : (
            <LockOpenIcon fontSize="large" />
          )}
        </IconButton>
      )
    }
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <Grid2
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={2}>
          {cart && (
            <Box component="span">{cart?.forms.length} forms in Cart</Box>
          )}
        </Grid2>
        <Grid2 size={2} offset={6}>
          <SearchInput
            term={term}
            onSearch={handleSearch}
            placeholder={T.translate("edit_sponsor.placeholders.search")}
          />
        </Grid2>
        <Grid2 size={2}>
          <Button
            variant="contained"
            size="medium"
            fullWidth
            onClick={() => setFormEdit("new")}
            startIcon={<AddIcon />}
            sx={{ height: "36px" }}
          >
            {T.translate("edit_sponsor.cart_tab.add_form")}
          </Button>
        </Grid2>
      </Grid2>
      {!cart && (
        <Typography variant="h6" textAlign="center">
          {T.translate("edit_sponsor.cart_tab.no_cart")}
        </Typography>
      )}
      {!!cart && (
        <Paper elevation={0} sx={{ width: "100%", mb: 2 }}>
          <MuiTable
            columns={tableColumns}
            data={cart?.forms}
            options={{}}
            onEdit={handleEdit}
            onDelete={handleDelete}
          >
            <TotalRow
              columns={tableColumns}
              total={cart?.total}
              targetCol="amount"
              trailing={2}
            />
          </MuiTable>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 4,
              pb: 4,
              gap: "10px"
            }}
          >
            <Button
              variant="contained"
              color="primary"
              style={{ minWidth: 250 }}
              onClick={handlePayCreditCard}
            >
              {T.translate("edit_sponsor.cart_tab.pay_cc")}
            </Button>
            <Button
              variant="contained"
              color="primary"
              style={{ minWidth: 250 }}
              onClick={handlePayInvoice}
            >
              {T.translate("edit_sponsor.cart_tab.pay_invoice")}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

const mapStateToProps = ({ sponsorPageCartListState }) => ({
  ...sponsorPageCartListState
});

export default connect(mapStateToProps, {
  getSponsorCart,
  deleteSponsorCartForm,
  lockSponsorCartForm,
  unlockSponsorCartForm
})(SponsorCartTab);
