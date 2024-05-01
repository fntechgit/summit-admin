/**
 * @jest-environment jsdom
 */
import React from "react";
import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import SummitForm from "../summit-form.js";

describe("form test", () => {
  test("render summit form with Summit.name set to 'test summit'", async () => {
    const currentSummit = {
      id: 1,
      name: 'test summit',
      active: false,
      allow_update_attendee_extra_questions: false,
      attendees_count: 0,
      available_on_api: false,
      calendar_sync_desc: '',
      calendar_sync_name: '',
      dates_label: '',
      end_date: 0,
      event_types: [],
      link: '',
      locations: [],
      logo: null,
      secondary_logo: null,
      page_url: '',
      presentation_voters_count: 0,
      presentation_votes_count: 0,
      presentations_submitted_count: 0,
      published_events_count: 0,
      reassign_ticket_till_date: 0,
      registration_begin_date: 0,
      registration_end_date: 0,
      registration_link: '',
      registration_disclaimer_content: '',
      registration_disclaimer_mandatory: false,
      schedule_event_detail_url: '',
      schedule_page_url: '',
      schedule_start_date: 0,
      secondary_registration_label: '',
      secondary_registration_link: '',
      speaker_announcement_email_accepted_alternate_count: 0,
      speaker_announcement_email_accepted_count: 0,
      speaker_announcement_email_accepted_rejected_count: 0,
      speaker_announcement_email_alternate_count: 0,
      speaker_announcement_email_alternate_rejected_count: 0,
      speaker_announcement_email_rejected_count: 0,
      speakers_count: 0,
      start_date: 0,
      start_showing_venues_date: 0,
      slug: '',
      supported_currencies: ['USD', 'EUR'],
      ticket_types: [],
      time_zone: {},
      time_zone_id: '',
      time_zone_label: '',
      timestamp: 0,
      tracks: [],
      type_id: 0,
      wifi_connections: [],
      selection_plans: [],
      meeting_booking_room_allowed_attributes: [],
      meeting_room_booking_end_time: null,
      meeting_room_booking_max_allowed: 0,
      meeting_room_booking_slot_length: 0,
      meeting_room_booking_start_time: null,
      api_feed_type: '',
      api_feed_url: '',
      api_feed_key: '',
      refund_policies: [],
      access_level_types: null,
      badge_types: null,
      badge_features: null,
      badge_view_types: null,
      order_extra_questions: null,
      order_only_extra_questions: null,
      attendee_extra_questions: null,
      attendee_main_extra_questions: null,
      begin_allow_booking_date: 0,
      end_allow_booking_date: 0,
      external_summit_id: null,
      external_registration_feed_type: '',
      external_registration_feed_api_key: null,
      virtual_site_url: null,
      marketing_site_url: null,
      mux_token_id: null,
      mux_token_secret: null,
      mux_allowed_domains: [],
      help_users : [],
      registration_send_qr_as_image_attachment_on_ticket_email : false,
      registration_send_ticket_as_pdf_attachment_on_ticket_email : false,
      registration_allow_automatic_reminder_emails : true,
      registration_send_order_email_automatically: true,
      qr_codes_enc_key: 'N/A',
      speaker_confirmation_default_page_url: '',
      marketing_site_oauth2_client_id:null,
      marketing_site_oauth2_client_scopes: null,
      available_lead_report_columns: [],
    };

    const timezones = ['UTC'];
    const errors = {};

    const { container } = render(<SummitForm entity={currentSummit} timezones={timezones} errors={errors}/>)
    const element = container.querySelector("#name")
    expect(element !== null).toBeTruthy();
    expect(element.value === 'test summit').toBeTruthy();
  });
});
