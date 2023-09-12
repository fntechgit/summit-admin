import React from "react";
import { connect } from 'react-redux';
import {Switch, Route, Redirect} from 'react-router-dom';
import EditRegFeedMetadataPage from "../pages/summits/edit-reg-feed-metadata-page";
import {Breadcrumb} from "react-breadcrumbs";
import T from "i18n-react";
import { getRegFeedMetadata, resetRegFeedMetadataForm } from "../actions/reg-feed-metadata-actions";

class RegFeedMetadataIdLayout extends React.Component {

    componentDidMount() {
        let regFeedMetadataId = this.props.match.params.reg_feed_metadata_id;

        if (!regFeedMetadataId) {
            this.props.resetRegFeedMetadataForm();
        } else {
            this.props.getRegFeedMetadata(regFeedMetadataId);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const oldId = prevProps.match.params.reg_feed_metadata_id;
        const newId = this.props.match.params.reg_feed_metadata_id;

        if (oldId !== newId) {
            if (!newId) {
                this.props.resetRegFeedMetadataForm();
            } else {
                this.props.getRegFeedMetadata(newId);
            }
        }
    }

    render() {
        const { match, currentRegFeedMetadata, currentSummit } = this.props;
        let regFeedMetadataId = this.props.match.params.reg_feed_metadata_id;
        let breadcrumb = regFeedMetadataId ? currentRegFeedMetadata.key : T.translate("general.new");
        return(
            <div>
                <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
                <Switch>
                    <Route strict exact path={`${match.url}`} component={EditRegFeedMetadataPage} />
                    <Redirect to={`/app/summits/${currentSummit.id}/reg-feed-metadata/${regFeedMetadataId}`} />
                </Switch>
            </div>
        );
    }
}

const mapStateToProps = ({ currentRegFeedMetadataState, currentSummitState }) => ({
    currentRegFeedMetadata   : currentRegFeedMetadataState.entity,
        ...currentSummitState
})

export default connect (
    mapStateToProps,
    {
        getRegFeedMetadata,
        resetRegFeedMetadataForm,
    }
)(RegFeedMetadataIdLayout);