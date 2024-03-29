import moment from 'moment-timezone';

// Event/Activity Type
export const getAllEventTypes = (currentSummit) => {
    if(!currentSummit) return null;
    return currentSummit.event_types?.sort((a,b) => a.order - b.order).map((t => ({label: t.name, value: t.id})));
}

// Track/Activity Category 
export const getAllTrackCategory = (currentSummit) => {
    if(!currentSummit) return null;
    return currentSummit.tracks?.sort((a,b) => a.order - b.order).map((t => ({label: t.name, value: t.id})));
}

// Badge Access Level Types
export const getAllBadgeAccessLevelTypes = (currentSummit) => {
    if(!currentSummit) return null;
    return currentSummit.badge_access_level_types?.sort((a, b) => a.order - b.order).map(t => ({label: t.name, value: t.id}));
}

// Locations/Venues
export const getAllLocations = (currentSummit) => {
    if(!currentSummit) return null;

    let venuesOptions = [];
    for(let i = 0; i < currentSummit.locations.length; i++) {
        let location = currentSummit.locations[i];
        if (location.class_name !== "SummitVenue") continue;
        let option = { value : location, label: location.name };
        venuesOptions.push(option);
        if(!location.hasOwnProperty('rooms')) continue;
        for(let j = 0; j < location.rooms.length ; j++){
            let subOption = { value : location.rooms[j] , label: location.rooms[j].name};
            venuesOptions.push(subOption);
        }
    }
    return venuesOptions;
}

// Selection Plans
export const getAllSelectionPlans = (currentSummit) => {
    if(!currentSummit) return null;

    let selectionPlanOptions = [];
    for(let i = 0; i < currentSummit.selection_plans.length; i++) {
        let selection_plan = currentSummit.selection_plans[i];
        let option = { value : selection_plan.id, label: selection_plan.name};

        selectionPlanOptions.push(option);
    }
    return selectionPlanOptions;
}

// Streaming Types
export const getAllStreamingTypes = () => ([{ label: 'LIVE', value: 'LIVE' }, { label: 'VOD', value: 'VOD' }]);

// Default columns to show 
export const defaultColumns = [
    'id',
    'event_type',
    'title',
    'selection_status',
];

export const editableColumns = [
    'event_type',
    'title',
    'speakers',
    'track',
    'selection_plan',
    'streaming_url',
    'meeting_url',
    'etherpad_link',
]

const formatDuration = (duration) => {
    let d = moment.duration(duration, 'seconds');
    return d.format('mm:ss') !== '00' ? d.format('mm:ss') : 'TBD';
}

export const flattenEventData = (e, summit) => {
    let published_date = (e.is_published ? moment(e.published_date * 1000).tz(summit.time_zone.name).format('MMMM Do YYYY, h:mm a') : 'No');
                
    let speakers_companies = Array.isArray(e.speakers) && e.speakers.length > 0 ? e.speakers?.map(e => e.company) : [];                
    speakers_companies = speakers_companies.length > 0 ? speakers_companies.filter((item,index) => item !== '' && speakers_companies.indexOf(item) === index) : []; 

    const event_type_capacity = [];

    if (e.type?.allows_location) event_type_capacity.push('Allows Location');
    if (e.type?.allows_attendee_vote) event_type_capacity.push('Allows Attendee Vote');
    if (e.type?.allows_publishing_dates) event_type_capacity.push('Allows Publishing Dates');

    return {
        id: e.id,
        event_type: e.type?.name,
        summit_id : e.summit_id,
        title: e.title,
        status: e.status ?? 'Not Submitted',
        selection_status: e.selection_status === 'unaccepted' && e.is_published === true ? 'accepted' : e.selection_status,
        published_date: published_date,
        created_by_fullname: e.hasOwnProperty('created_by') ? `${e.created_by.first_name} ${e.created_by.last_name} (${e.created_by.email})`:'TBD',
        submitter_company: e.hasOwnProperty('created_by') ? e.created_by.company : 'N/A',
        speakers: (Array.isArray(e.speakers) && e.speakers.length > 0) ? e.speakers.map(s => `${s.first_name} ${s.last_name}`).join(',') : 'N/A',
        speaker_company: (speakers_companies.length > 0) ? speakers_companies.reduce((accumulator, company) => accumulator + (accumulator !== '' ? ', ' : '') + company, '') : 'N/A',
        duration: e.type?.allows_publishing_dates ?
            formatDuration(e.duration) : 'N/A',
        speakers_count: e.type?.use_speakers ? (Array.isArray(e.speakers) && e.speakers.length > 0) ? e.speakers.length : '0' : 'N/A',
        event_type_capacity: event_type_capacity.reduce((accumulator, capacity) => accumulator + (accumulator !== '' ? ', ' : '') + capacity, ''),
        track: e?.track?.name ? e?.track?.name : 'TBD',
        level: e.level ? e.level : 'N/A',
        tags: (Array.isArray(e.tags) && e.tags.length > 0) ? e.tags.reduce((accumulator, t) => accumulator + (accumulator !== '' ? ', ' : '') + t.tag, '') : 'N/A',
        selection_plan: e.selection_plan?.name ? e.selection_plan?.name : 'N/A',
        location: e.location?.name ? e.location?.name : 'N/A',
        streaming_url: e.streaming_url ? e.streaming_url : 'N/A',
        meeting_url: e.meeting_url ? e.meeting_url : 'N/A',
        etherpad_link: e.etherpad_link ? e.etherpad_link : 'N/A',
        streaming_type: e.streaming_type ? e.streaming_type : 'N/A',
        start_date: e.start_date ? moment(e.start_date * 1000).tz(summit.time_zone.name).format('MMMM Do YYYY, h:mm a') : 'TBD',
        end_date: e.end_date ? moment(e.end_date * 1000).tz(summit.time_zone.name).format('MMMM Do YYYY, h:mm a') : 'TBD',
        sponsor: (Array.isArray(e.sponsors) && e.sponsors.length > 0) ? e.sponsors.map(s => s.name).join(', ') : 'N/A',
        media_uploads: (Array.isArray(e.media_uploads) && e.media_uploads?.length > 0) ? e?.media_uploads?.map( m => ({...m, created:moment(m.created * 1000).tz(summit.time_zone.name).format('MMMM Do YYYY, h:mm a') })) : 'N/A',
    };
}
