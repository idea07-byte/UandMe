import React from 'react';
import ErrorState from './ErrorState';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 Uncaught UI Error in React component tree:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#111B21] text-[#E9EDEF] p-4">
          <ErrorState
            title="Something unexpected happened"
            message={
              this.state.error?.message ||
              'A problem occurred in the interface. Click below to reload and restore your active session.'
            }
            retryLabel="Reload PulseChat"
            onRetry={this.handleReload}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
