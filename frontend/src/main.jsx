
// Global Fetch Interceptor to inject security headers
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  try {
    const userStr = localStorage.getItem('pbj_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.role) {
        options.headers = {
          ...options.headers,
          'X-User-Role': user.role,
          'X-User-Satker': user.idSatker || '',
          'X-User-Nip': user.nip || '',
        };
      }
    }
  } catch (e) {
    console.error('Error injecting security headers:', e);
  }
  return originalFetch(url, options);
};

import React from 'react'

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("GLOBAL REACT ERROR BOUNDARY CAUGHT:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white', zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflow: 'auto' }}>
          <h1 style={{fontSize: '24px', fontWeight: 'bold'}}>Fatal React Error!</h1>
          <p>Please screenshot this and send to the agent:</p>
          <pre style={{background: 'rgba(0,0,0,0.2)', padding: '10px', marginTop: '10px', whiteSpace: 'pre-wrap'}}>{this.state.error && this.state.error.toString()}</pre>
          <pre style={{background: 'rgba(0,0,0,0.2)', padding: '10px', marginTop: '10px', whiteSpace: 'pre-wrap'}}>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GlobalErrorBoundary><App /></GlobalErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)