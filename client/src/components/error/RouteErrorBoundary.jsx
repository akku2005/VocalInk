import React from 'react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Route-specific error boundary with custom fallback UI
 */
export class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log to error tracking service in production
    if (import.meta.env.PROD) {
      // TODO: Log to Sentry or other service
      console.error('Route Error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <div className="text-6xl">😞</div>
            <h2 className="text-2xl font-bold text-text-primary">
              {this.props.title || 'Something went wrong'}
            </h2>
            <p className="text-text-secondary">
              {this.props.message || 'We encountered an error loading this page. Please try again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-hover"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap routes with error boundaries
 */
export function withRouteErrorBoundary(Component, errorBoundaryProps = {}) {
  return function WrappedComponent(props) {
    return (
      <RouteErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </RouteErrorBoundary>
    );
  };
}

export default RouteErrorBoundary;
