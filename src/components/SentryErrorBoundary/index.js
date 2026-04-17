import React, { Component } from "react";
import { SentryFallbackFunction } from "../SentryErrorComponent";

class SentryErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { ErrorBoundary: null };
  }

  componentDidMount() {
    if (window.SENTRY_DSN && window.SENTRY_DSN !== "") {
      import("../../sentry-init").then(({ initSentry }) => {
        const Sentry = initSentry();
        this.setState({ ErrorBoundary: Sentry.ErrorBoundary });
      });
    }
  }

  render() {
    const { ErrorBoundary } = this.state;
    const { children, componentName } = this.props;

    if (ErrorBoundary) {
      return (
        <ErrorBoundary
          fallback={SentryFallbackFunction({ componentName })}
        >
          {children}
        </ErrorBoundary>
      );
    }

    return children;
  }
}

export default SentryErrorBoundary;
