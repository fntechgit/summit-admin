/**
 * Copyright 2026 OpenStack Foundation
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

import React, { useEffect } from "react";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import {
  Box,
  Button,
  Grid2,
  IconButton,
  Paper,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockClosedIcon from "@mui/icons-material/Lock";
import MuiTable, { TotalRow } from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "../../../../../../components/mui/search-input";
import {
  deleteSponsorCartForm,
  getSponsorCart,
  lockSponsorCartForm,
  unlockSponsorCartForm,
  saveSponsorCartNote,
  deleteSponsorCartNote
} from "../../../../../../actions/sponsor-cart-actions";
import CartNote from "./cart-note";
import { SPONSOR_CART_NOTE_TYPES } from "../../../../../../utils/constants";

const CartView = ({
  cart,
  term,
  getSponsorCart,
  deleteSponsorCartForm,
  lockSponsorCartForm,
  unlockSponsorCartForm,
  onEdit,
  onAddForm,
  saveSponsorCartNote,
  deleteSponsorCartNote
}) => {
  useEffect(() => {
    getSponsorCart();
  }, []);

  const handleSearch = (searchTerm) => {
    getSponsorCart(searchTerm);
  };

  const handleDelete = (itemId) => {
    deleteSponsorCartForm(itemId);
  };

  const handleManageItems = (item) => {
    console.log("MANAGE ITEMS : ", item);
  };

  const handleLock = (form) => {
    if (form.is_locked) {
      unlockSponsorCartForm(form.id);
    } else {
      lockSponsorCartForm(form.id);
    }
  };

  const handlePayCreditCard = () => {
    console.log("PAY CREDIT CARD");
  };

  const handlePayInvoice = () => {
    console.log("PAY INVOICE");
  };

  const cartData = cart?.forms.map((form) => ({
    ...form,
    discount: form.discount === "0%" ? "" : form.discount
  }));

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
      columnKey: "addon_name",
      header: T.translate("edit_sponsor.cart_tab.add_ons")
    },
    {
      columnKey: "item_count",
      header: T.translate("edit_sponsor.cart_tab.items")
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
    <>
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
            onClick={onAddForm}
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
            data={cartData}
            options={{}}
            onEdit={onEdit}
            onDelete={handleDelete}
            deleteDialogBody={(formName) =>
              T.translate("edit_sponsor.cart_tab.delete_form_confirm", {
                form: formName ?? ""
              })
            }
            confirmButtonColor="error"
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
              disabled={cart?.net_amount === 0}
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
      <CartNote
        title={T.translate("edit_sponsor.cart_tab.sponsor_note.title")}
        notes={cart?.notes.filter(
          (n) => n.type === SPONSOR_CART_NOTE_TYPES.SPONSOR
        )}
        placeholder={T.translate(
          "edit_sponsor.cart_tab.sponsor_note.placeholder"
        )}
        onSave={(note) =>
          saveSponsorCartNote(note, SPONSOR_CART_NOTE_TYPES.SPONSOR)
        }
        onDelete={deleteSponsorCartNote}
      />
      <CartNote
        title={T.translate("edit_sponsor.cart_tab.order_note.title")}
        notes={cart?.notes.filter(
          (n) => n.type === SPONSOR_CART_NOTE_TYPES.INTERNAL
        )}
        placeholder={T.translate(
          "edit_sponsor.cart_tab.order_note.placeholder"
        )}
        onSave={(note) =>
          saveSponsorCartNote(note, SPONSOR_CART_NOTE_TYPES.INTERNAL)
        }
        onDelete={deleteSponsorCartNote}
        multiple
      />
    </>
  );
};

const mapStateToProps = ({ sponsorPageCartListState }) => ({
  ...sponsorPageCartListState
});

export default connect(mapStateToProps, {
  getSponsorCart,
  deleteSponsorCartForm,
  lockSponsorCartForm,
  unlockSponsorCartForm,
  saveSponsorCartNote,
  deleteSponsorCartNote
})(CartView);
