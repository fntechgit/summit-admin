import React, { useState } from "react";
import { Panel, Table } from "openstack-uicore-foundation/lib/components";

const EventReport = ({ data, options, tableCols, storedReport, onSort }) => {
  const [showSection, setShowSection] = useState(null);

  const toggleSection = (sectionName) => {
    const newSection = showSection === sectionName ? null : sectionName;
    setShowSection(newSection);
  };

  // report is not loaded yet
  if (!data?.length || storedReport.name !== "Metrics Report") return <div />;


  return data
    .filter(rm => rm.events.length)
    .map(room => {
      const name = room.name;
      const id = room.id;

      return (
        <div className="panel panel-default" key={`section_${id}`}>
          <div className="panel-heading">{name}</div>
          <div style={{ padding: 10 }}>
            {room.events.map((ev) => {
              const sectionId = `section_${ev.id}`;

              return (
                <Panel
                  show={showSection === sectionId}
                  title={`${ev.title} (${ev.metrics.length})`}
                  handleClick={() => toggleSection(sectionId)}
                  key={sectionId}
                >
                  <div className="table-responsive">
                    <Table
                      options={options}
                      data={ev.metrics}
                      columns={tableCols}
                      onSort={onSort}
                    />
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>
      );
    });
};

export default EventReport;
