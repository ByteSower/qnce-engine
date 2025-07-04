import React from 'react';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import { AutosaveIndicator } from '../components/AutosaveIndicator';
import { createQNCEEngine } from '../../engine/core';
import { DEMO_STORY } from '../../engine/demo-story';

// Mock the useAutosave hook
jest.mock('../../integrations/react', () => ({
  useAutosave: jest.fn()
}));

// Get the mocked version
import { useAutosave } from '../../integrations/react';
const mockUseAutosave = useAutosave as jest.MockedFunction<typeof useAutosave>;

describe('AutosaveIndicator', () => {
  let engine: any;
  let mockAutosaveState: any;

  beforeEach(() => {
    engine = createQNCEEngine(DEMO_STORY);
    
    mockAutosaveState = {
      autosave: jest.fn().mockResolvedValue(undefined),
      configure: jest.fn(),
      isEnabled: true,
      isSaving: false,
      lastAutosave: new Date('2025-07-03T12:00:00Z')
    };

    mockUseAutosave.mockReturnValue(mockAutosaveState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default minimal variant', () => {
      render(<AutosaveIndicator engine={engine} />);
      
      const indicator = screen.getByRole('status', { name: /autosave status/i });
      expect(indicator).toBeInTheDocument();
    });

    it('renders with detailed variant', () => {
      render(<AutosaveIndicator engine={engine} variant="detailed" />);
      
      const indicator = screen.getByRole('status', { name: /autosave status/i });
      expect(indicator).toBeInTheDocument();
    });

    it('renders with icon-only variant', () => {
      render(<AutosaveIndicator engine={engine} variant="icon-only" />);
      
      const indicator = screen.getByRole('status', { name: /autosave status/i });
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('shows saving status when isSaving is true', () => {
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        isSaving: true,
        status: 'saving'
      });

      render(<AutosaveIndicator engine={engine} variant="detailed" />);
      
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });

    it('shows saved status when save is complete', () => {
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        status: 'saved'
      });

      render(<AutosaveIndicator engine={engine} variant="detailed" />);
      
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });

    it('shows error status on save failure', () => {
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        status: 'error'
      });

      render(<AutosaveIndicator engine={engine} variant="detailed" />);
      
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('shows disabled status when autosave is disabled', () => {
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        status: 'disabled'
      });

      render(<AutosaveIndicator engine={engine} variant="detailed" />);
      
      expect(screen.getByText(/disabled/i)).toBeInTheDocument();
    });
  });

  describe('Timestamp Display', () => {
    it('shows timestamp when showTimestamp is true', () => {
      render(<AutosaveIndicator engine={engine} variant="detailed" showTimestamp={true} />);
      
      // Should show some form of timestamp
      expect(screen.getByText(/12:00/)).toBeInTheDocument();
    });

    it('hides timestamp when showTimestamp is false', () => {
      render(<AutosaveIndicator engine={engine} variant="detailed" showTimestamp={false} />);
      
      // Should not show timestamp
      expect(screen.queryByText(/12:00/)).not.toBeInTheDocument();
    });

    it('shows "Never" when no lastAutosave is available', () => {
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        lastAutosave: null
      });

      render(<AutosaveIndicator engine={engine} variant="detailed" showTimestamp={true} />);
      
      expect(screen.getByText(/never/i)).toBeInTheDocument();
    });
  });

  describe('Auto-hide Behavior', () => {
    it('automatically hides after autoHideDelay', async () => {
      jest.useFakeTimers();
      
      render(<AutosaveIndicator engine={engine} autoHideDelay={1000} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toBeVisible();
      
      // Fast-forward time
      jest.advanceTimersByTime(1500);
      
      await waitFor(() => {
        expect(indicator).toHaveStyle({ opacity: '0' });
      });
      
      jest.useRealTimers();
    });

    it('does not auto-hide when autoHideDelay is 0', () => {
      render(<AutosaveIndicator engine={engine} autoHideDelay={0} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toBeVisible();
    });

    it('resets hide timer when status changes', async () => {
      jest.useFakeTimers();
      
      const { rerender } = render(
        <AutosaveIndicator engine={engine} autoHideDelay={1000} />
      );
      
      // Advance halfway through hide delay
      jest.advanceTimersByTime(500);
      
      // Change status (trigger state change)
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        isSaving: true,
        status: 'saving'
      });
      
      rerender(<AutosaveIndicator engine={engine} autoHideDelay={1000} />);
      
      // Advance past original hide time
      jest.advanceTimersByTime(600);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toBeVisible();
      
      jest.useRealTimers();
    });
  });

  describe('Animation and Transitions', () => {
    it('applies fade-in animation on status change', () => {
      const { rerender } = render(<AutosaveIndicator engine={engine} />);
      
      // Change status to trigger animation
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        isSaving: true,
        status: 'saving'
      });
      
      rerender(<AutosaveIndicator engine={engine} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({ transition: 'opacity 0.3s ease-in-out' });
    });

    it('shows pulsing animation during saving', () => {
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        isSaving: true,
        status: 'saving'
      });

      render(<AutosaveIndicator engine={engine} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('animate-pulse');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<AutosaveIndicator engine={engine} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Autosave Status');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('updates aria-label based on status', () => {
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        isSaving: true,
        status: 'saving'
      });

      render(<AutosaveIndicator engine={engine} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', expect.stringContaining('saving'));
    });

    it('provides screen reader friendly text', () => {
      render(<AutosaveIndicator engine={engine} variant="detailed" />);
      
      // Should have visually hidden text for screen readers
      const srText = screen.getByText(/status/i, { selector: '.sr-only, [class*="sr-only"]' });
      expect(srText).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('applies default theme colors based on status', () => {
      render(<AutosaveIndicator engine={engine} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({ color: expect.any(String) });
    });

    it('applies custom theme', () => {
      const customTheme = {
        colors: {
          primary: '#ff0000',
          success: '#00ff00',
          warning: '#ffff00',
          error: '#ff4444',
          disabled: '#666666',
          background: '#f8f9fa',
          surface: '#ffffff',
          text: '#333333',
          textSecondary: '#666666',
          secondary: '#6c757d'
        }
      };

      render(<AutosaveIndicator engine={engine} theme={customTheme} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies custom className', () => {
      render(<AutosaveIndicator engine={engine} className="custom-indicator" />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('custom-indicator');
    });

    it('applies custom style', () => {
      const customStyle = { backgroundColor: 'red' };
      render(<AutosaveIndicator engine={engine} style={customStyle} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({ backgroundColor: 'red' });
    });

    it('applies different variants correctly', () => {
      const { rerender } = render(<AutosaveIndicator engine={engine} variant="minimal" />);
      let indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();

      rerender(<AutosaveIndicator engine={engine} variant="detailed" />);
      indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Status Icon Display', () => {
    it('shows checkmark icon for saved status', () => {
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        status: 'saved'
      });

      render(<AutosaveIndicator engine={engine} variant="detailed" />);
      
      // Look for checkmark symbol or icon
      expect(screen.getByText(/✓|✔/)).toBeInTheDocument();
    });

    it('shows spinner icon for saving status', () => {
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        isSaving: true,
        status: 'saving'
      });

      render(<AutosaveIndicator engine={engine} variant="detailed" />);
      
      // Look for spinner symbol
      expect(screen.getByText(/⟳|◐/)).toBeInTheDocument();
    });

    it('shows error icon for error status', () => {
      mockUseAutosave.mockReturnValue({
        ...mockAutosaveState,
        status: 'error'
      });

      render(<AutosaveIndicator engine={engine} variant="detailed" />);
      
      // Look for error symbol
      expect(screen.getByText(/✗|⚠/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null engine gracefully', () => {
      // This should not crash
      expect(() => {
        render(<AutosaveIndicator engine={null as any} />);
      }).not.toThrow();
    });

    it('handles missing autosave hook return values', () => {
      mockUseAutosave.mockReturnValue({
        autosave: jest.fn(),
        configure: jest.fn(),
        isEnabled: false,
        isSaving: false,
        lastAutosave: null
      });

      expect(() => {
        render(<AutosaveIndicator engine={engine} />);
      }).not.toThrow();
    });

    it('updates correctly when engine prop changes', () => {
      const newEngine = createQNCEEngine(DEMO_STORY);
      const { rerender } = render(<AutosaveIndicator engine={engine} />);
      
      expect(() => {
        rerender(<AutosaveIndicator engine={newEngine} />);
      }).not.toThrow();
    });
  });
});
