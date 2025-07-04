import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  createQNCEEngine, 
  DEMO_STORY,
  useQNCE,
  UndoRedoControls,
  AutosaveIndicator,
  useKeyboardShortcuts
} from '../src/index';

/**
 * QNCE Engine UI Components Demo
 * Sprint 3.6: Demonstrates autosave indicators, undo/redo controls, and keyboard shortcuts
 * 
 * Features showcased:
 * - UndoRedoControls component with different layouts and themes
 * - AutosaveIndicator with various configurations
 * - Keyboard shortcuts integration
 * - Real-time state updates and visual feedback
 * - Accessibility features
 */

const QNCEDemo: React.FC = () => {
  const [engine] = useState(() => createQNCEEngine(DEMO_STORY));
  const { currentNode, availableChoices, flags, selectChoice, resetNarrative } = useQNCE(engine);

  // Enable keyboard shortcuts
  useKeyboardShortcuts(engine, {
    enabled: true,
    bindings: {
      undo: ['ctrl+z', 'cmd+z'],
      redo: ['ctrl+y', 'cmd+y', 'ctrl+shift+z'],
      save: ['ctrl+s', 'cmd+s'],
      reset: ['ctrl+r'] // Enable reset with confirmation
    }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const appStyle: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
    lineHeight: 1.6,
    color: '#333'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const narrativeStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    lineHeight: 1.8,
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderLeft: '4px solid #007bff',
    borderRadius: '0 4px 4px 0'
  };

  const choiceButtonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '0.75rem 1rem',
    margin: '0.5rem 0',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  const controlsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '1rem'
  };

  const flagsStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    padding: '0.5rem',
    borderRadius: '4px',
    fontFamily: 'monospace'
  };

  return (
    <div style={appStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <h1>🎮 QNCE Engine UI Components Demo</h1>
        <p>Sprint 3.6: Interactive showcase of autosave indicators, undo/redo controls, and keyboard shortcuts</p>
        <p style={{ fontSize: '0.9rem', color: '#6c757d' }}>
          <strong>Keyboard shortcuts:</strong> Ctrl/Cmd+Z (Undo), Ctrl/Cmd+Y (Redo), Ctrl/Cmd+S (Save)
        </p>
      </header>

      {/* Controls Section */}
      <section style={sectionStyle}>
        <h2>🎛️ Controls & Status</h2>
        <div style={controlsContainerStyle}>
          {/* Autosave Indicator */}
          <AutosaveIndicator 
            engine={engine}
            variant="detailed"
            showTimestamp={true}
            autoHideDelay={3000}
          />

          {/* Undo/Redo Controls - Horizontal Layout */}
          <UndoRedoControls
            engine={engine}
            size="md"
            layout="horizontal"
            showLabels={true}
            onUndo={() => console.log('Undo performed')}
            onRedo={() => console.log('Redo performed')}
          />

          {/* Reset Button */}
          <button
            onClick={resetNarrative}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>

          {/* Toggle Advanced View */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>
      </section>

      {/* Advanced Controls (when enabled) */}
      {showAdvanced && (
        <section style={sectionStyle}>
          <h3>🔧 Advanced Controls</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Vertical Layout Undo/Redo */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Vertical Layout</h4>
              <UndoRedoControls
                engine={engine}
                size="sm"
                layout="vertical"
                showLabels={false}
              />
            </div>

            {/* Large Size Controls */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Large Size</h4>
              <UndoRedoControls
                engine={engine}
                size="lg"
                layout="horizontal"
                showLabels={true}
                theme={{
                  colors: {
                    primary: '#28a745',
                    background: '#ffffff'
                  }
                }}
              />
            </div>

            {/* Icon-only Autosave */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Icon-only</h4>
              <AutosaveIndicator 
                engine={engine}
                variant="icon-only"
                showTimestamp={false}
              />
            </div>

            {/* Minimal Autosave */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Minimal</h4>
              <AutosaveIndicator 
                engine={engine}
                variant="minimal"
                showTimestamp={false}
                theme={{
                  colors: {
                    success: '#17a2b8',
                    warning: '#ffc107'
                  }
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Narrative Section */}
      <section style={sectionStyle}>
        <h2>📖 Current Scene</h2>
        <div style={narrativeStyle}>
          {currentNode.text}
        </div>

        {/* Choices */}
        {availableChoices.length > 0 && (
          <div>
            <h3>Choose your path:</h3>
            {availableChoices.map((choice, index) => (
              <button
                key={index}
                onClick={() => selectChoice(choice)}
                style={choiceButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0056b3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#007bff';
                }}
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}

        {/* End of story message */}
        {availableChoices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>🎊 The End</h3>
            <p>You've reached the end of this narrative path.</p>
            <button
              onClick={resetNarrative}
              style={{
                ...choiceButtonStyle,
                backgroundColor: '#28a745',
                width: 'auto',
                display: 'inline-block'
              }}
            >
              Start Over
            </button>
          </div>
        )}
      </section>

      {/* Story State Info */}
      <section style={sectionStyle}>
        <h3>📊 Story State</h3>
        <div style={flagsStyle}>
          <strong>Current Node:</strong> {currentNode.id}<br/>
          <strong>Flags:</strong> {Object.keys(flags).length > 0 ? JSON.stringify(flags, null, 2) : 'None set'}
        </div>
      </section>

      {/* Instructions */}
      <section style={sectionStyle}>
        <h3>💡 Usage Instructions</h3>
        <ul style={{ lineHeight: 1.8 }}>
          <li><strong>Make choices</strong> to progress through the story and see autosave indicators</li>
          <li><strong>Use keyboard shortcuts:</strong> Ctrl/Cmd+Z to undo, Ctrl/Cmd+Y to redo, Ctrl/Cmd+S to save</li>
          <li><strong>Watch the autosave indicator</strong> show status changes in real-time</li>
          <li><strong>Try the undo/redo buttons</strong> to navigate through your choice history</li>
          <li><strong>Toggle advanced view</strong> to see different component variations</li>
          <li><strong>All components are accessible</strong> with keyboard navigation and screen readers</li>
        </ul>
      </section>
    </div>
  );
};

// Initialize the demo
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<QNCEDemo />);
} else {
  console.error('Root container not found');
}
