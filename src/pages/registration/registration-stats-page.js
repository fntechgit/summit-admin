/**
 * Copyright 2022 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

import React, {useEffect, useState, useMemo} from 'react'
import {connect} from 'react-redux';
import T from "i18n-react";
import {Pie} from "react-chartjs-2";
import {Chart} from 'chart.js';
import {trim} from "../../utils/methods";
import {Breadcrumb} from "react-breadcrumbs";
import DateIntervalFilter from "../../components/filters/date-interval-filter";
import {getRegistrationStats} from "../../actions/summit-stats-actions";

const DATA_POOLING_INTERVAL = 4000;

function createDonnutCanvas(arc, percent) {
  const newCanvas = document.createElement('canvas');
  const ctx = newCanvas.getContext('2d');

  newCanvas.width = 80;
  newCanvas.height = 55;

  ctx.font = "10px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${percent}%`, 32, 28);

  ctx.beginPath()
  ctx.fillStyle = arc?.options?.backgroundColor;
  ctx.arc(32,25,20, arc.startAngle, arc.endAngle, false); // outer (filled)
  ctx.arc(32,25,14,arc.endAngle,arc.startAngle, true); // inner (unfills it)
  ctx.fill();

  ctx.beginPath()
  ctx.arc(32,25,20,0,Math.PI*2, true);
  ctx.stroke();
  ctx.beginPath()
  ctx.arc(32,25,14,0,Math.PI*2, true);
  ctx.stroke();

  return newCanvas;
}


const RegistrationStatsPage = ({currentSummit, summitStats, match, getRegistrationStats}) => {
  const [chartLoaded, setChartLoaded] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    setChartLoaded(true);
  }, []);

  useEffect(() => {
    // initial load
    getRegistrationStats(fromDate, toDate);

    // pooling
    const interval = setInterval(() => {
      getRegistrationStats(fromDate, toDate, false);
    }, DATA_POOLING_INTERVAL);

    return () => clearInterval(interval);
  }, [fromDate, toDate]);

  const chartOptions = {
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 80,
        left: 80,
        right: 80,
        bottom: 80
      }
    },
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            return context.label || '';
          }
        }
      },
      legend: {
        display: true,
        position: 'bottom',
        maxWidth: 100,
        align: 'start',
        labels: {
          usePointStyle: true,
          font: {size: 18, lineHeight: 2.5},
          padding: 35,
          boxHeight: 50,
          generateLabels: (chart) => {
            const total = chart.data.datasets[0].data.reduce((res, it) => res + it, 0);
            return chart.data.labels.map((label, i) => {
              const data = chart.data.datasets[0];
              const color = data.backgroundColor[i];
              const arc = chart.getDatasetMeta(0).data[i];
              const percent = Math.round((data.data[i] / total) * 100);

              return {
                text: `${label} / ${total}`,
                fillStyle: color,
                fontColor: color,
                strokeStyle: color,
                hidden: chart._hiddenIndices[i],
                index: i,
                pointStyle: createDonnutCanvas(arc, percent),
              };
            }, this);
          }
        }
      }
    }
  };

  const dataTickets = useMemo(() => (
    {
      labels: [
        `Actives : ${summitStats.total_active_tickets}`,
        `Inactives : ${summitStats.total_inactive_tickets}`,
      ],
      datasets: [
        {
          label: '# of Tickets',
          data: [
            summitStats.total_active_tickets,
            summitStats.total_inactive_tickets
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderColor: "#fff",
          borderWidth: 1,
        },
      ],
    }
  ), [summitStats.total_active_tickets, summitStats.total_inactive_tickets]);

  const dataTicketTypesBackgroundColor = useMemo(() => summitStats.total_tickets_per_type.map(tt => {
    let r = Math.floor(Math.random() * 200);
    let g = Math.floor(Math.random() * 200);
    let b = Math.floor(Math.random() * 200);
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }), [summitStats.total_tickets_per_type?.length]);

  const dataTicketTypes = useMemo(() => ({
    labels: summitStats.total_tickets_per_type.map(tt => `${trim(tt.type, 75)} : ${parseInt(tt.qty)}`),
    datasets: [
      {
        label: 'Ticket Types',
        data: summitStats.total_tickets_per_type.map(tt => parseInt(tt.qty)),
        backgroundColor: dataTicketTypesBackgroundColor,
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  }), [summitStats.total_tickets_per_type]);

  const totalTicketTypes = summitStats.total_tickets_per_type.reduce(function (accumulator, currentValue) {
    return accumulator + parseInt(currentValue.qty);
  }, 0);

  const dataBadgeTypesBackgroundColor = useMemo(() => summitStats.total_badges_per_type.map(tt => {
    let r = Math.floor(Math.random() * 200);
    let g = Math.floor(Math.random() * 200);
    let b = Math.floor(Math.random() * 200);
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }), [summitStats.total_badges_per_type?.length]);

  const dataBadgeTypes = useMemo(() => ({
    labels: summitStats.total_badges_per_type.map(tt => `${trim(tt.type, 75)} : ${parseInt(tt.qty)}`),
    datasets: [
      {
        label: 'Badge Types',
        data: summitStats.total_badges_per_type.map(tt => parseInt(tt.qty)),
        backgroundColor: dataBadgeTypesBackgroundColor,
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  }), [summitStats.total_badges_per_type]);

  const totalBadgeTypes = summitStats.total_badges_per_type.reduce(function (accumulator, currentValue) {
    return accumulator + parseInt(currentValue.qty);
  }, 0);

  const dataTicketsPerBadgeFeaturesBackgroundColor = useMemo(() =>
    summitStats.total_tickets_per_badge_feature.map(tt => {
      let r = Math.floor(Math.random() * 200);
      let g = Math.floor(Math.random() * 200);
      let b = Math.floor(Math.random() * 200);
      return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    }), [summitStats.total_tickets_per_badge_feature?.length]);

  const dataTicketsPerBadgeFeatures = useMemo(() => ({
    labels: summitStats.total_tickets_per_badge_feature.map(tt => `${tt.type} : ${parseInt(tt.tickets_qty)}`),
    datasets: [
      {
        label: 'Badge Features1',
        data: summitStats.total_tickets_per_badge_feature.map(tt => parseInt(tt.tickets_qty)),
        backgroundColor: dataTicketsPerBadgeFeaturesBackgroundColor,
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  }), [summitStats.total_tickets_per_badge_feature]);

  const dataCheckinsPerBadgeFeaturesBackgroundColor = useMemo(() =>
    summitStats.total_tickets_per_badge_feature.map(tt => {
      let r = Math.floor(Math.random() * 200);
      let g = Math.floor(Math.random() * 200);
      let b = Math.floor(Math.random() * 200);
      return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    }), [summitStats.total_tickets_per_badge_feature?.length]);

  const dataCheckinsPerBadgeFeatures = useMemo(() => ({
    labels: summitStats.total_tickets_per_badge_feature.map(tt => `${tt.type} : ${parseInt(tt.checkin_qty)}`),
    datasets: [
      {
        label: 'Badge Features1',
        data: summitStats.total_tickets_per_badge_feature.map(tt => parseInt(tt.checkin_qty)),
        backgroundColor: dataCheckinsPerBadgeFeaturesBackgroundColor,
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  }), [summitStats.total_tickets_per_badge_feature]);

  const dataAttendees = {
    labels: [`Checked In : ${summitStats.total_checked_in_attendees}`,
      `Non Checked In: ${summitStats.total_non_checked_in_attendees}`,
    ],
    datasets: [
      {
        label: 'In Person Attendees',
        data: [
          summitStats.total_checked_in_attendees,
          summitStats.total_non_checked_in_attendees,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  };

  const dataVirtualAttendees = {
    labels: [
      `Virtual Check In ${summitStats.total_virtual_attendees}`,
      `Non Virtual Checked In: ${summitStats.total_virtual_non_checked_in_attendees}`,
    ],
    datasets: [
      {
        label: 'Virtual Attendees',
        data: [
          summitStats.total_virtual_attendees,
          summitStats.total_virtual_non_checked_in_attendees,
        ],
        backgroundColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  };

  if (!chartLoaded) return null;

  return (
    <div className="container">
      <Breadcrumb data={{title: T.translate("dashboard.registration_stats"), pathname: match.url}}/>
      <div className="filters">
        <DateIntervalFilter onFilter={(from, to) => {
          setFromDate(from);
          setToDate(to);
          getRegistrationStats(from, to)
        }} timezone={currentSummit.time_zone_id}/>
      </div>
      <div>
        <div className="row">
          <div className="col-md-6">
            <i className="fa fa-money"/>&nbsp;{T.translate("dashboard.payment_amount_collected")}&nbsp;
            <strong>$&nbsp;{parseFloat(summitStats.total_payment_amount_collected).toFixed(2)}</strong>
          </div>
          <div className="col-md-6">
            {T.translate("dashboard.refund_amount_emitted")}&nbsp;
            <strong>$&nbsp;{parseFloat(summitStats.total_refund_amount_emitted).toFixed(2)}</strong>
          </div>
        </div>
        {(summitStats.total_active_tickets + summitStats.total_inactive_tickets) > 0 &&
        <>
          <h5><i
            className="fa fa-ticket"/>&nbsp;{T.translate("dashboard.total_tickets")} ({summitStats.total_active_tickets + summitStats.total_inactive_tickets})
            / {T.translate("dashboard.orders")} ({summitStats.total_orders})</h5>
          <div className="row">
            <div className="col-md-12">
              <Pie data={dataTickets}
                   width={625}
                   height={625}
                   options={chartOptions}
              />
            </div>
          </div>
        </>
        }
        {totalTicketTypes > 0 &&
        <div className="row">
          <div className="col-md-6">
            <h5>{T.translate("dashboard.ticket_types")} ({totalTicketTypes})</h5>
            <div className="row">
              <div className="col-md-12">
                <Pie data={dataTicketTypes}
                     width={625}
                     height={625}
                     options={chartOptions}
                />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <h5>{T.translate("dashboard.badge_types")} ({totalBadgeTypes})</h5>
            <div className="row">
              <div className="col-md-12">
                <Pie data={dataBadgeTypes}
                     width={625}
                     height={625}
                     options={chartOptions}
                />
              </div>
            </div>
          </div>
        </div>
        }
        {summitStats.total_tickets_per_badge_feature.some(t => t.tickets_qty > 0) &&
        <div className="row">
          <div className="col-md-12">
            <h5>{T.translate("dashboard.badge_features_tickets")}</h5>
            <div className="row">
              <div className="col-md-12">
                <Pie data={dataTicketsPerBadgeFeatures}
                     width={625}
                     height={625}
                     options={chartOptions}
                />
              </div>
            </div>
          </div>
        </div>
        }
        {summitStats.total_tickets_per_badge_feature.some(t => t.checkin_qty > 0) &&
        <div className="row">
          <div className="col-md-12">
            <h5>{T.translate("dashboard.badge_features_checkins")}</h5>
            <div className="row">
              <div className="col-md-12">
                <Pie data={dataCheckinsPerBadgeFeatures}
                     width={625}
                     height={625}
                     options={chartOptions}
                />
              </div>
            </div>
          </div>
        </div>
        }
        {(summitStats.total_checked_in_attendees +
          summitStats.total_non_checked_in_attendees +
          summitStats.total_virtual_attendees + summitStats.total_virtual_non_checked_in_attendees) > 0 &&
        <>
          <div className="row">
            <div className="col-md-6">
              <h5>
                <i className="fa fa-users"/>
                &nbsp;
                {T.translate("dashboard.in_person_attendees")} ({summitStats.total_checked_in_attendees + summitStats.total_non_checked_in_attendees})
              </h5>
            </div>
            <div className="col-md-6">
              <h5>
                <i className="fa fa-users"/>
                &nbsp;
                {T.translate("dashboard.virtual_attendees")} ({summitStats.total_virtual_attendees + summitStats.total_virtual_non_checked_in_attendees})
              </h5>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <Pie data={dataAttendees}
                   width={625}
                   height={625}
                   options={chartOptions}
              />
            </div>
            <div className="col-md-6">
              <Pie data={dataVirtualAttendees}
                   width={625}
                   height={625}
                   options={chartOptions}
              />
            </div>
          </div>
        </>
        }
      </div>
    </div>
  );
}

const mapStateToProps = ({currentSummitState, summitStatsState}) => ({
  currentSummit: currentSummitState.currentSummit,
  summitStats: summitStatsState
})

export default connect(
  mapStateToProps,
  {getRegistrationStats}
)(RegistrationStatsPage);
