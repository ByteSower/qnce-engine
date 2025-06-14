import DemoFlow from './components/DemoFlow';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-300 flex items-center justify-center">
      <div className="w-full max-w-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-900">QNCE Demo</h1>
        <DemoFlow />
      </div>
    </div>
  );
}

export default App;
