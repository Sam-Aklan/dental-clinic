import { Component, type ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (
      this.state.hasError &&
      prevProps.resetKeys &&
      this.props.resetKeys &&
      !prevProps.resetKeys.every((v, i) => v === this.props.resetKeys![i])
    ) {
      this.setState({ hasError: false });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}
