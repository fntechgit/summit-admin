import T from 'i18n-react/dist/i18n-react';
import {capitalize} from '../utils/methods';

export const attendee_extra_questions_key = 'attendee_extra_questions';
export const sponsor_extra_questions_key = 'extra_questions';

const format = (collection, section) => {
    if (collection.length === 1 && collection[0] === '*') {
       return [{value: '*', name: '*', section}];
    }
    return collection.map(q => { 
         return {value: q.id, name: q.name, section};
    });
}

export const normalizeLeadReportSettings = (allowed_columns_flat) => {

    if (!allowed_columns_flat) return {};

    let res = {};
    const aeq = {};
    const seq = {};
    aeq[attendee_extra_questions_key] = [];
    seq[sponsor_extra_questions_key] = [];

    let col = null;
    for(const column of allowed_columns_flat) {
        try {
            col = JSON.parse(column);
        } catch {
            col = column;
        }
        if (Object.hasOwn(col, 'section')) {
            const value = col.value === '*' ? '*' : {id: col.value, name: col.name};
            (col.section === attendee_extra_questions_key ? aeq[col.section] : seq[col.section]).push(value);
        } else {
            res[col] = col;
        }
    }
    return {...res, ...aeq, ...seq};
}

export const denormalizeLeadReportSettings = (settingColumns, formatCallback = format) => {
    if (!settingColumns) return [];
    return Object.entries(settingColumns).reduce((a, item) => {
        if (item[0] === attendee_extra_questions_key) {
            a.push(...formatCallback(item[1], attendee_extra_questions_key));
        } else if (item[0] === sponsor_extra_questions_key) {
            a.push(...formatCallback(item[1], sponsor_extra_questions_key));
        } else {
            a.push({ value: item[1], name: item[1] });
        }
        return a;
    }, []);
}

export const renderOptions = (collection) => 
    collection.map(item => { 
        if (Object.hasOwn(item, 'section')) {
            const label = item.value === '*' ? T.translate("lead_report_settings.all_questions") : item.name
            const sectionName = item.section === attendee_extra_questions_key ? 
                T.translate("lead_report_settings.attendee_question_section") : 
                T.translate("lead_report_settings.sponsor_question_section");
            return {value: JSON.stringify(item), label: `${label} (${sectionName})`};
        }
        return {value: item.value, label: item.value.split('_').map(s => capitalize(s)).join(' ')};
    });

export const getSummitLeadReportSettings = (summit, sponsorId = 0) => {
    const res = summit.lead_report_settings.filter(s => s.sponsor_id === sponsorId);
    if (res.length === 0) return null;
    return res[0];
}

export const updateSummitLeadReportSettings = (summit, summitSettings, sponsorId = 0) => {
    const siblings = summit.lead_report_settings.filter(s => s.sponsor_id !== sponsorId);
    return [...siblings, summitSettings];
}

