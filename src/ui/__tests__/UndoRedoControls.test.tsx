import React from 'react';
import { render, act } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { UndoRedoControls } from '../components/UndoRedoControls';
import { createQNCEEngine } from '../../engine/core';
import { DEMO_STORY } from '../../engine/demo-story';

// Mock the useUndoRedo hook
jest.mock('../../integrations/react', () => ({
  useUndoRedo: jest.fn()
}));

// Get the mocked version
import { useUndoRedo } from '../../integrations/react';
const mockUseUndoRedo = useUndoRedo as jest.MockedFunction<typeof useUndoRedo>;

describe('UndoRedoControls', () => {
  let engine: any;
  let mockUndoRedoState: any;

  beforeEach(() => {
    engine = createQNCEEngine(DEMO_STORY);
    
    mockUndoRedoState = {
      undo: jest.fn().mockResolvedValue({ success: true, description: 'Undid action' }),
      redo: jest.fn().mockResolvedValue({ success: true, description: 'Redid action' }),
      canUndo: true,
      canRedo: true,
      undoCount: 2,
      redoCount: 1
    };

    // Setup the mock to return our mock state
    mockUseUndoRedo.mockReturnValue(mockUndoRedoState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders undo and redo buttons', () => {
      act(() => {
        render(<UndoRedoControls engine={engine} />);
      });
      
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
    });

    it('displays custom labels when provided', () => {
      const customLabels = { undo: 'Go Back', redo: 'Go Forward' };
      
      render(
        <UndoRedoControls 
          engine={engine} 
          labels={customLabels}
        />
      );
      
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go forward/i })).toBeInTheDocument();
    });

    it('hides labels when showLabels is false', () => {
      render(
        <UndoRedoControls 
          engine={engine} 
          showLabels={false}
        />
      );
      
      // Should still have accessible names but no visible text
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
      
      // Text should not be visible (aria-label only)
      expect(screen.queryByText('Undo')).not.toBeInTheDocument();
      expect(screen.queryByText('Redo')).not.toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('enables buttons when actions are available', () => {
      render(<UndoRedoControls engine={engine} />);
      
      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });
      
      expect(undoButton).not.toBeDisabled();
      expect(redoButton).not.toBeDisabled();
    });

    it('disables undo button when canUndo is false', () => {
      mockUseUndoRedo.mockReturnValue({
        ...mockUndoRedoState,
        canUndo: false
      });

      render(<UndoRedoControls engine={engine} />);
      
      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toBeDisabled();
    });

    it('disables redo button when canRedo is false', () => {
      mockUseUndoRedo.mockReturnValue({
        ...mockUndoRedoState,
        canRedo: false
      });

      render(<UndoRedoControls engine={engine} />);
      
      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toBeDisabled();
    });

    it('disables all buttons when disabled prop is true', () => {
      render(<UndoRedoControls engine={engine} disabled={true} />);
      
      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });
      
      expect(undoButton).toBeDisabled();
      expect(redoButton).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('calls undo function when undo button is clicked', async () => {
      const user = userEvent.setup();
      render(<UndoRedoControls engine={engine} />);
      
      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);
      
      expect(mockUndoRedoState.undo).toHaveBeenCalledTimes(1);
    });

    it('calls redo function when redo button is clicked', async () => {
      const user = userEvent.setup();
      render(<UndoRedoControls engine={engine} />);
      
      const redoButton = screen.getByRole('button', { name: /redo/i });
      await user.click(redoButton);
      
      expect(mockUndoRedoState.redo).toHaveBeenCalledTimes(1);
    });

    it('calls onUndo callback when provided', async () => {
      const onUndo = jest.fn();
      const user = userEvent.setup();
      
      render(<UndoRedoControls engine={engine} onUndo={onUndo} />);
      
      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);
      
      await waitFor(() => {
        expect(onUndo).toHaveBeenCalledWith({ success: true, description: 'Undid action' });
      });
    });

    it('calls onRedo callback when provided', async () => {
      const onRedo = jest.fn();
      const user = userEvent.setup();
      
      render(<UndoRedoControls engine={engine} onRedo={onRedo} />);
      
      const redoButton = screen.getByRole('button', { name: /redo/i });
      await user.click(redoButton);
      
      await waitFor(() => {
        expect(onRedo).toHaveBeenCalledWith({ success: true, description: 'Redid action' });
      });
    });
  });

  describe('Layout and Styling', () => {
    it('applies horizontal layout by default', () => {
      render(<UndoRedoControls engine={engine} />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveStyle({ flexDirection: 'row' });
    });

    it('applies vertical layout when specified', () => {
      render(<UndoRedoControls engine={engine} layout="vertical" />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveStyle({ flexDirection: 'column' });
    });

    it('applies custom className', () => {
      render(<UndoRedoControls engine={engine} className="custom-controls" />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveClass('custom-controls');
    });

    it('applies custom style', () => {
      const customStyle = { backgroundColor: 'red' };
      render(<UndoRedoControls engine={engine} style={customStyle} />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveStyle({ backgroundColor: 'red' });
    });

    it('applies different sizes correctly', () => {
      const { rerender } = render(<UndoRedoControls engine={engine} size="sm" />);
      let buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveStyle({ fontSize: '0.875rem' });

      rerender(<UndoRedoControls engine={engine} size="lg" />);
      buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveStyle({ fontSize: '1.125rem' });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<UndoRedoControls engine={engine} />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveAttribute('aria-label', 'Undo and Redo Controls');
      
      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });
      
      expect(undoButton).toHaveAttribute('aria-label');
      expect(redoButton).toHaveAttribute('aria-label');
    });

    it('shows tooltips with state information', () => {
      render(<UndoRedoControls engine={engine} />);
      
      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });
      
      expect(undoButton).toHaveAttribute('title');
      expect(redoButton).toHaveAttribute('title');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<UndoRedoControls engine={engine} />);
      
      // Tab to first button
      await user.tab();
      expect(screen.getByRole('button', { name: /undo/i })).toHaveFocus();
      
      // Tab to second button
      await user.tab();
      expect(screen.getByRole('button', { name: /redo/i })).toHaveFocus();
    });

    it('activates buttons with Enter and Space keys', async () => {
      const user = userEvent.setup();
      render(<UndoRedoControls engine={engine} />);
      
      const undoButton = screen.getByRole('button', { name: /undo/i });
      undoButton.focus();
      
      // Test Enter key
      await user.keyboard('{Enter}');
      expect(mockUndoRedoState.undo).toHaveBeenCalledTimes(1);
      
      // Test Space key
      await user.keyboard(' ');
      expect(mockUndoRedoState.undo).toHaveBeenCalledTimes(2);
    });
  });

  describe('Theme Integration', () => {
    it('applies default theme', () => {
      render(<UndoRedoControls engine={engine} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button: HTMLElement) => {
        expect(button).toHaveStyle({ borderRadius: '4px' });
      });
    });

    it('applies custom theme', () => {
      const customTheme = {
        borderRadius: {
          sm: '2px',
          md: '8px',
          lg: '12px'
        }
      };

      render(<UndoRedoControls engine={engine} theme={customTheme} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button: HTMLElement) => {
        expect(button).toHaveStyle({ borderRadius: '8px' });
      });
    });
  });

  describe('Error Handling', () => {
    it('handles undo/redo failures gracefully', async () => {
      mockUseUndoRedo.mockReturnValue({
        ...mockUndoRedoState,
        undo: jest.fn().mockResolvedValue({ success: false, error: 'Undo failed' })
      });

      const onUndo = jest.fn();
      const user = userEvent.setup();
      
      render(<UndoRedoControls engine={engine} onUndo={onUndo} />);
      
      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);
      
      await waitFor(() => {
        expect(onUndo).toHaveBeenCalledWith({ success: false, error: 'Undo failed' });
      });
    });
  });
});
