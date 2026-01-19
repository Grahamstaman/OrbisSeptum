import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center h-screen w-screen bg-gray-900 text-white p-10 font-mono">
                    <div className="max-w-4xl w-full bg-black/50 border border-red-500/50 rounded-xl p-8 shadow-2xl backdrop-blur-xl">
                        <h1 className="text-3xl font-bold text-red-500 mb-4 flex items-center gap-3">
                            <span className="text-4xl">⚠️</span> CRITICAL SYSTEM FAILURE
                        </h1>
                        <p className="text-gray-400 mb-6 border-b border-gray-800 pb-4">
                            An unhandled exception has occurred in the application rendering pipeline.
                        </p>

                        <div className="bg-black/80 rounded-lg p-4 mb-6 border border-red-900/30 overflow-x-auto">
                            <h3 className="text-red-400 font-bold text-sm mb-2 uppercase tracking-wider">Error Message</h3>
                            <code className="text-red-300 block mb-4">
                                {this.state.error && this.state.error.toString()}
                            </code>

                            <h3 className="text-gray-500 font-bold text-xs mb-2 uppercase tracking-wider">Stack Trace</h3>
                            <pre className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
                        >
                            REBOOT SYSTEM (RELOAD)
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
