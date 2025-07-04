import { QNCEEngine } from '../engine/core';

/**
 * Theme configuration for QNCE UI components
 */
export interface QNCETheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    disabled: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      sm: string;
      md: string;
      lg: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

/**
 * Props for UndoRedoControls component
 */
export interface UndoRedoControlsProps {
  /** QNCE Engine instance */
  engine: QNCEEngine;
  /** Custom theme (optional, uses default if not provided) */
  theme?: Partial<QNCETheme>;
  /** Additional CSS class name */
  className?: string;
  /** Custom styling */
  style?: React.CSSProperties;
  /** Disable the controls */
  disabled?: boolean;
  /** Show labels on buttons */
  showLabels?: boolean;
  /** Custom button labels */
  labels?: {
    undo: string;
    redo: string;
  };
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Button layout */
  layout?: 'horizontal' | 'vertical';
  /** Callback when undo is performed */
  onUndo?: () => void;
  /** Callback when redo is performed */
  onRedo?: () => void;
}

/**
 * Autosave status
 */
export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Props for AutosaveIndicator component
 */
export interface AutosaveIndicatorProps {
  /** QNCE Engine instance */
  engine: QNCEEngine;
  /** Custom theme (optional, uses default if not provided) */
  theme?: Partial<QNCETheme>;
  /** Additional CSS class name */
  className?: string;
  /** Custom styling */
  style?: React.CSSProperties;
  /** Indicator variant */
  variant?: 'minimal' | 'detailed' | 'icon-only';
  /** Position of the indicator */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
  /** Custom status messages */
  messages?: {
    idle: string;
    saving: string;
    saved: string;
    error: string;
  };
  /** Show timestamp of last save */
  showTimestamp?: boolean;
  /** Auto-hide after successful save (ms) */
  autoHideDelay?: number;
}

/**
 * Keyboard shortcuts configuration
 */
export interface KeyboardShortcutsConfig {
  /** Enable/disable keyboard shortcuts */
  enabled?: boolean;
  /** Custom key bindings */
  bindings?: {
    undo?: string[];
    redo?: string[];
    save?: string[];
    reset?: string[];
  };
  /** Prevent default browser behavior */
  preventDefault?: boolean;
  /** Element to attach listeners to (defaults to document) */
  target?: HTMLElement | Document;
}

/**
 * Default theme for QNCE components
 */
export const defaultTheme: QNCETheme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    disabled: '#d1d5db',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  }
};
