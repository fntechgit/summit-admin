import React, { Suspense } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import { Switch, Route } from "react-router-dom";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import { getSponsor, resetSponsorForm } from "../actions/sponsor-actions";

const SponsorPage = React.lazy(() => import("../pages/sponsors/sponsor-page"));
const EditAdSponsorPage = React.lazy(() =>
  import("../pages/sponsors/edit-advertisement-sponsor-page")
);
const EditMaterialSponsorPage = React.lazy(() =>
  import("../pages/sponsors/edit-material-sponsor-page")
);
const EditSocialNetworkSponsorPage = React.lazy(() =>
  import("../pages/sponsors/edit-social-network-sponsor-page")
);
const EditSponsorExtraQuestion = React.lazy(() =>
  import("../pages/sponsors/edit-sponsor-extra-question-page")
);
const NoMatchPage = React.lazy(() => import("../pages/no-match-page"));

class SponsorIdLayout extends React.Component {
  constructor(props) {
    const sponsorId = props.match.params.sponsor_id;
    super(props);

    if (!sponsorId) {
      props.resetSponsorForm();
    } else {
      props.getSponsor(sponsorId);
    }
  }

  componentDidUpdate(prevProps) {
    const oldId = prevProps.match.params.sponsor_id;
    const newId = this.props.match.params.sponsor_id;

    if (oldId !== newId) {
      if (!newId) {
        this.props.resetSponsorForm();
      } else {
        this.props.getSponsor(newId);
      }
    }
  }

  render() {
    const { match, currentSponsor } = this.props;
    const sponsorId = this.props.match.params.sponsor_id;
    const breadcrumb = currentSponsor.id
      ? currentSponsor.company?.name
      : T.translate("general.new");

    if (sponsorId && !currentSponsor.id) return <div />;

    return (
      <div>
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <Suspense fallback={<AjaxLoader show relative size={120} />}>
          <Switch>
            <Route
              path={`${match.url}/ads`}
              render={(props) => (
                <div>
                  <Breadcrumb
                    data={{ title: "Advertisements", pathname: match.url }}
                  />
                  <Switch>
                    <Route
                      exact
                      strict
                      path={`${props.match.url}/new`}
                      component={EditAdSponsorPage}
                    />
                    <Route
                      path={`${props.match.url}/:advertisement_id(\\d+)`}
                      component={EditAdSponsorPage}
                    />
                    <Route component={NoMatchPage} />
                  </Switch>
                </div>
              )}
            />
            <Route
              path={`${match.url}/materials`}
              render={(props) => (
                <div>
                  <Breadcrumb
                    data={{ title: "Materials", pathname: match.url }}
                  />
                  <Switch>
                    <Route
                      exact
                      strict
                      path={`${props.match.url}/new`}
                      component={EditMaterialSponsorPage}
                    />
                    <Route
                      path={`${props.match.url}/:material_id(\\d+)`}
                      component={EditMaterialSponsorPage}
                    />
                    <Route component={NoMatchPage} />
                  </Switch>
                </div>
              )}
            />
            <Route
              path={`${match.url}/social-networks`}
              render={(props) => (
                <div>
                  <Breadcrumb
                    data={{ title: "Social Networks", pathname: match.url }}
                  />
                  <Switch>
                    <Route
                      exact
                      strict
                      path={`${props.match.url}/new`}
                      component={EditSocialNetworkSponsorPage}
                    />
                    <Route
                      path={`${props.match.url}/:social_network_id(\\d+)`}
                      component={EditSocialNetworkSponsorPage}
                    />
                    <Route component={NoMatchPage} />
                  </Switch>
                </div>
              )}
            />
            <Route
              path={`${match.url}/extra-questions`}
              render={(props) => (
                <div>
                  <Breadcrumb
                    data={{ title: "Extra Questions", pathname: match.url }}
                  />
                  <Switch>
                    <Route
                      exact
                      strict
                      path={`${props.match.url}/new`}
                      component={EditSponsorExtraQuestion}
                    />
                    <Route
                      path={`${props.match.url}/:extra_question_id(\\d+)`}
                      component={EditSponsorExtraQuestion}
                    />
                    <Route component={NoMatchPage} />
                  </Switch>
                </div>
              )}
            />
            <Route path={match.url} component={SponsorPage} />
            <Route component={NoMatchPage} />
          </Switch>
        </Suspense>
      </div>
    );
  }
}

const mapStateToProps = ({ currentSponsorState, currentSummitState }) => ({
  currentSponsor: currentSponsorState.entity,
  ...currentSummitState
});

export default connect(mapStateToProps, {
  getSponsor,
  resetSponsorForm
})(SponsorIdLayout);
