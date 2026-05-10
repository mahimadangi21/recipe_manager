import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-red-50 rounded-3xl border border-red-100 mt-8">
          <div className="text-center space-y-4">
            <div className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-100">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              The application encountered an unexpected error. We've logged the details and are looking into it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-900 text-white px-6 py-2 rounded-xl font-semibold hover:bg-black transition-all flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-white rounded-xl border border-red-100 text-left overflow-auto max-h-40">
                <pre className="text-xs text-red-500 font-mono">
                  {this.state.error?.toString()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
