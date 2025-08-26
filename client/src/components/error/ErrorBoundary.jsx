import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '../ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // In production, you would send this to your error tracking service
    // Example: Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo, errorId);
    }
  }

  logErrorToService = (error, errorInfo, errorId) => {
    // TODO: Implement error logging service integration
    // Example: Sentry.captureException(error, { extra: errorInfo, tags: { errorId } });
    console.error('Production error logged:', { errorId, error: error.message });
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-text-primary">
                Oops! Something went wrong
              </h1>
              <p className="text-text-secondary">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
            </div>

            {/* Error ID for support */}
            {this.state.errorId && (
              <div className="p-3 bg-surface border border-border rounded-lg">
                <p className="text-xs text-text-secondary">
                  Error ID: <code className="font-mono bg-background px-2 py-1 rounded">
                    {this.state.errorId}
                  </code>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="primary"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            {/* Development Error Details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-surface border border-border rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-text-primary mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Error:</strong>
                    <pre className="mt-1 p-2 bg-background rounded overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 p-2 bg-background rounded overflow-auto max-h-32">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 