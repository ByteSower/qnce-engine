import DemoFlow from './components/DemoFlow';
import './index.css';

function App() {
  return (
    <div
      style={{ margin: '0 auto', textAlign: 'center' }}
      className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-red-900 to-black text-white"
    >
      <header className="w-full container mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow text-center">
          QNCE Demo
        </h1>
      </header>
      <div className="max-w-4xl w-full mx-auto px-4 text-center">
        <DemoFlow />
      </div>
    </div>
  );
}

export default App;
