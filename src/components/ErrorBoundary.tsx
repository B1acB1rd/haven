import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        console.error('Error caught by boundary:', error.message);
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // Log error to analytics or error tracking service
        // You could integrate Sentry, LogRocket, etc. here
        this.logErrorToService(error, errorInfo);
    }

    logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
        // TODO: Implement error logging service
        // Example: Sentry.captureException(error, { extra: errorInfo });
        console.error('Error logged:', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });
    };

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-gray-800 border border-red-500/20 rounded-lg p-6 shadow-xl">
                        <div className="flex items-center mb-4">
                            <svg
                                className="w-6 h-6 text-red-500 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
                        </div>

                        <p className="text-gray-300 mb-4">
                            We encountered an unexpected error. This has been logged and we'll look into it.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-4">
                                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
                                    Error Details (Development Only)
                                </summary>
                                <div className="bg-gray-900 p-3 rounded text-xs text-red-400 overflow-auto max-h-40">
                                    <p className="font-semibold">{this.state.error.message}</p>
                                    <pre className="mt-2 text-gray-500">{this.state.error.stack}</pre>
                                </div>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                            >
                                Reload App
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
