import React from 'react';
import {connect} from 'react-redux';
import ActionsTableCell from './ActionsTableCell';
import {deleteTrackTimeframe, saveTrackTimeframe} from "../../../actions/track-timeframes-actions"
import T from "i18n-react/dist/i18n-react";
import ReactTooltip from "react-tooltip";

import './styles.css';
import 'awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css'
import {shallowEqual} from "../../../utils/methods";
import LocationDropdown from "../../inputs/location-dropdown";

const createRow = (row, actions) => {
  var cells = [];
  
  if (row.is_edit) {
    cells = [
      <td key="location_id">{row.location.name}</td>,
      <td key="days">
          <div className="form-check abc-checkbox">
              <input
                id="all_days"
                type="checkbox"
                checked={row.all_days}
                onChange={ev => actions.handleChange(row.id, ev)}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="all_days">
                  {T.translate("track_timeframes.all_days")}
              </label>
          </div>
      </td>,
    ]
  } else {
    const timeframes = row.allowed_timeframes.map(tf => tf.id).join(' ,');
    cells = [
      <td key="location_id">{row.location.name}</td>,
      <td key="days">{timeframes || 'all days'}</td>,
    ]
  }
  
  
  if (actions) {
    cells.push(<ActionsTableCell key={'actions_' + row.id} id={row.id} actions={actions}/>);
  }
  
  return cells;
};

const createNewRow = (row, actions, locations) => {
  let cells = [
    <td key="new_location_id">
      <LocationDropdown
        id="location_id"
        value={row.location_id}
        onChange={actions.handleChange}
        locations={locations}
      />
    </td>,
    <td key="new_days">
      <div className="form-check abc-checkbox">
        <input
          id="new_all_days"
          type="checkbox"
          checked={true}
          disabled
          onChange={actions.handleChange}
          className="form-check-input"
        />
        <label className="form-check-label" htmlFor="new_all_days">
          {T.translate("track_timeframes.all_days")}
        </label>
      </div>
    </td>
  ];
  
  cells.push(
    <td key='add_new'>
      <button className="btn btn-default" onClick={actions.save}> Add</button>
    </td>
  );
  
  return cells;
};


class TrackTimeframeTable extends React.Component {
  
  constructor(props) {
    super(props);
    
    this.new_row = {
      location_id: null,
      all_days: true,
    };
    
    this.state = {
      rows: props.data,
      new_row: {...this.new_row},
    };
    
    this.actions = {};
    this.actions.edit = this.editRow.bind(this);
    this.actions.save = this.saveRow.bind(this);
    this.actions.delete = this.deleteClick.bind(this);
    this.actions.handleChange = this.onChangeCell.bind(this);
    this.actions.cancel = this.editRowCancel.bind(this);
    
    this.newActions = {};
    this.newActions.save = this.saveNewRow.bind(this);
    this.newActions.handleChange = this.onChangeNewCell.bind(this);
  }
  
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!shallowEqual(this.props.data, prevProps.data)) {
      this.setState({rows: this.props.data})
    }
  }
  
  saveRow(id) {
    const {rows} = this.state;
    let row = rows.find(r => r.id === id);
    row.is_edit = false;
    
    this.editing_row = null;
    
    this.setState({
      rows: rows
    });
    
    this.props.saveTrackTimeframe(row);
  }
  
  deleteClick(id) {
    this.props.deleteTrackTimeframe(id);
  }
  
  editRow(id, ev) {
    const {rows} = this.state;
    let row = rows.find(r => r.id === id);
    
    //save editing row for cancel
    this.editing_row = {...row};
    
    row.is_edit = true;
    
    this.setState({
      rows: rows
    });
  }
  
  editRowCancel(id, ev) {
    const {rows} = this.state;
    rows.forEach(r => {
      r.is_edit = false;
    });
    
    let rowIdx = rows.findIndex(r => r.id === id);
    
    rows[rowIdx] = this.editing_row;
    
    this.setState({
      rows: rows
    });
  }
  
  onChangeCell(id, ev) {
    const {rows} = this.state;
    let field = ev.target;
    let row = rows.find(r => r.id === id);
    let value = field.value;
    
    if (ev.target.type === 'datetime') {
      value = value.valueOf() / 1000;
    }
    
    if (ev.target.type === 'checkbox') {
      value = ev.target.checked;
    }
    
    row[field.id] = value;
    
    this.setState({rows: rows});
  }
  
  onChangeNewCell(ev) {
    const {new_row} = this.state;
    let field = ev.target;
    let value = field.value;
    
    if (ev.target.type === 'datetime') {
      value = value.valueOf() / 1000;
    }
    
    new_row[field.id] = value;
    
    this.setState({
      new_row: new_row
    });
  }
  
  saveNewRow(ev) {
    const {trackId} = this.props;
    ev.preventDefault();
    const new_row = {...this.state.new_row};
    this.setState({new_row: {...this.new_row}});
    
    this.props.saveTrackTimeframe(trackId, new_row.location_id);
  }
  
  render() {
    const {locations} = this.props;
    const {rows, new_row} = this.state;
    
    return (
      <div>
        <table className="table table-striped table-bordered table-hover trackTimeframesTable">
          <thead>
          <tr>
            <th style={{width: '40%'}}>{T.translate("track_timeframes.location")}</th>
            <th style={{width: '40%'}}>{T.translate("track_timeframes.timeframes")}</th>
            <th style={{width: '20%'}}>&nbsp;</th>
          </tr>
          </thead>
          <tbody>
          {rows.map((row, i) => {
            let rowClass = i % 2 === 0 ? 'even' : 'odd';
            
            return (
              <>
                <tr id={row.id} key={'row_' + row.id} role="row" className={rowClass}>
                  {createRow(row, this.actions)}
                </tr>
                {row.is_edit && !row.all_days &&
                  <div>here goes the timefram editable table</div>
                }
              </>
            );
          })}
          
          <tr id='new_row' key='new_row' className="odd">
            {createNewRow(new_row, this.newActions, locations)}
          </tr>
          </tbody>
        </table>
        <ReactTooltip delayShow={10}/>
      </div>
    );
  }
};

const mapStateToProps = ({currentSummitState}) => ({
  locations: currentSummitState.currentSummit.locations,
})

export default connect(
  mapStateToProps,
  {
    saveTrackTimeframe,
    deleteTrackTimeframe,
  }
)(TrackTimeframeTable);
