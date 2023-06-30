import {LOGOUT_USER} from 'openstack-uicore-foundation/lib/security/actions';
import {RECEIVE_SUMMIT, REQUEST_SUMMIT} from '../../actions/summit-actions';
import { epochToMomentTimeZone } from 'openstack-uicore-foundation/lib/utils/methods'

import {
  RECEIVE_ATTENDEE_DATA,
  RECEIVE_REGISTRATION_STATS,
  REGISTRATION_DATA_LOADED,
  REGISTRATION_DATA_REQUESTED,
  UPDATE_TIME_UNIT
} from '../../actions/summit-stats-actions'

const DEFAULT_STATE = {
  summitTZ: 'UTC',
  loadingData: false,
  total_active_tickets: 0,
  total_inactive_tickets: 0,
  total_orders: 0,
  total_active_assigned_tickets: 0,
  total_payment_amount_collected: 0,
  total_refund_amount_emitted: 0,
  total_tickets_per_type: [],
  total_badges_per_type: [],
  total_checked_in_attendees: 0,
  total_non_checked_in_attendees: 0,
  total_virtual_attendees: 0,
  total_virtual_non_checked_in_attendees: 0,
  total_tickets_per_badge_feature: [],
  attendees: [],
  groupedAttendees: [],
  timeUnit: 'day'
};

const summitStatsReducer = (state = DEFAULT_STATE, action) => {
  const {type, payload} = action
  switch (type) {
    case LOGOUT_USER: {
      return DEFAULT_STATE
    }
    case REQUEST_SUMMIT: {
      return DEFAULT_STATE
    }
    case RECEIVE_SUMMIT: {
      let entity = {...payload.response};
      return {...state, summitTZ: entity.time_zone_id}
    }
    case REGISTRATION_DATA_REQUESTED: {
      return {...state, loadingData: true, attendees: []};
    }
    case RECEIVE_REGISTRATION_STATS: {
      const stats = payload.response;
      return {...state, ...stats};
    }
    case RECEIVE_ATTENDEE_DATA: {
      const {data, page} = payload.response;
      const attendees = page === 1 ? data : [...state.attendees, ...data];
      return {...state, attendees};
    }
    case REGISTRATION_DATA_LOADED: {
      // group attendees by timeUnit
      const groupedAttendees = groupAttendees(state.timeUnit, state.attendees, state.summitTZ);
      
      return {...state, loadingData: false, groupedAttendees}
    }
    case UPDATE_TIME_UNIT: {
      const groupedAttendees = groupAttendees(payload.unit, state.attendees, state.summitTZ);
      return {...state, timeUnit: payload.unit, groupedAttendees};
    }
    default:
      return state;
  }

}

const groupAttendees = (unit, attendees, summitTZ) => {
  const sortedAttendees = attendees.sort((a,b) => a.summit_hall_checked_in_date - b.summit_hall_checked_in_date);
  const format = unit === 'day' ? 'MMM Do' : unit === 'hour' ? 'M/D h a' : 'M/D hh:mm a';
  
  return sortedAttendees.reduce((result, item) => {
    const slot = epochToMomentTimeZone(item.summit_hall_checked_in_date, summitTZ).format(format);
    const grp = result.find(it => it.slot === slot);
    if (grp) {
      grp.count++;
    } else {
      result.push({slot, count: 1});
    }
    
    return result
  }, []);
};

export default summitStatsReducer
