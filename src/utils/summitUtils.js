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
        let option = { value : selection_plan, label: selection_plan.name };
        selectionPlanOptions.push(option);
    }
    return selectionPlanOptions;
}

// Streaming Types
export const getAllStreamingTypes = () => ([{ label: 'LIVE', value: 'LIVE' }, { label: 'VOD', value: 'VOD' }]);