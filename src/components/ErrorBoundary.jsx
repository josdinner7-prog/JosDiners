import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
            <span className="material-icons text-3xl">report_problem</span>
          </div>
          <h2 className="text-xl font-black mb-2">Something went wrong while rendering this section</h2>
          <p className="text-slate-400 text-sm max-w-md mb-4">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase cursor-pointer transition active:scale-95 shadow-lg"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                window.location.href = '/'
              }}
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase cursor-pointer transition active:scale-95"
            >
              Go to Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
