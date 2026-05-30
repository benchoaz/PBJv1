const fs = require('fs');
const file = '/home/beni/PBJ/frontend/src/main.jsx';
let content = fs.readFileSync(file, 'utf8');

const boundaryCode = `
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
`;

if (!content.includes('class GlobalErrorBoundary')) {
  // Remove existing import React if present to avoid duplicate
  content = content.replace(/import React.*?\n/, '');
  content = boundaryCode + '\n' + content;
  content = content.replace('<App />', '<GlobalErrorBoundary><App /></GlobalErrorBoundary>');
  fs.writeFileSync(file, content);
  console.log('GlobalErrorBoundary injected to main.jsx');
} else {
  console.log('Already injected');
}
