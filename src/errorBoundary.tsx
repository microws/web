import { Component, ErrorInfo, ReactNode, useEffect } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  message?: string;
}
interface State {
  hasError: boolean;
}

export class MicrowsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.log(info);
    console.error(error);
    globalThis.handleError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function MicrowsWrapError(fallback: ReactNode, Component: ReactNode) {
  return <MicrowsErrorBoundary fallback={fallback}>{Component}</MicrowsErrorBoundary>;
}
