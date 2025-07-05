import React, { useState, useEffect, useMemo } from 'react';
import { UndoRedoControlsProps, defaultTheme, QNCETheme } from '../types';
import { useUndoRedo } from '../../integrations/react';

/**
 * UndoRedoControls Component
 * 
 * Provides accessible undo/redo buttons with real-time state updates,
 * tooltips, keyboard support, and customizable theming.
 * 
 * Features:
 * - Real-time enable/disable based on undo/redo availability
 * - Accessible with ARIA labels and keyboard navigation
 * - Customizable themes and layouts
 * - Integration with QNCE Engine undo/redo system
 */
export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  engine,
  theme: customTheme,
  className = '',
  style,
  disabled = false,
  showLabels = true,
  labels = { undo: 'Undo', redo: 'Redo' },
  size = 'md',
  layout = 'horizontal',
  onUndo,
  onRedo
}) => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    undoCount,
    redoCount
  } = useUndoRedo(engine);

  // Merge custom theme with default theme
  const theme: QNCETheme = useMemo(() => ({
    ...defaultTheme,
    ...customTheme,
    colors: { ...defaultTheme.colors, ...customTheme?.colors },
    spacing: { ...defaultTheme.spacing, ...customTheme?.spacing },
    borderRadius: { ...defaultTheme.borderRadius, ...customTheme?.borderRadius },
    typography: { 
      ...defaultTheme.typography, 
      ...customTheme?.typography,
      fontSize: { ...defaultTheme.typography.fontSize, ...customTheme?.typography?.fontSize },
      fontWeight: { ...defaultTheme.typography.fontWeight, ...customTheme?.typography?.fontWeight }
    },
    shadows: { ...defaultTheme.shadows, ...customTheme?.shadows }
  }), [customTheme]);

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      fontSize: theme.typography.fontSize.sm,
      iconSize: '16px'
    },
    md: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: theme.typography.fontSize.md,
      iconSize: '20px'
    },
    lg: {
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      fontSize: theme.typography.fontSize.lg,
      iconSize: '24px'
    }
  };

  const currentSize = sizeConfig[size];

  // Button styles
  const buttonBaseStyle: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily,
    fontSize: currentSize.fontSize,
    fontWeight: theme.typography.fontWeight.medium,
    padding: currentSize.padding,
    borderRadius: theme.borderRadius.md,
    border: `1px solid ${theme.colors.primary}`,
    backgroundColor: theme.colors.background,
    color: theme.colors.primary,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    boxShadow: theme.shadows.sm,
    outline: 'none',
    position: 'relative'
  };

  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: theme.colors.surface,
    color: theme.colors.disabled,
    borderColor: theme.colors.disabled,
    cursor: 'not-allowed',
    boxShadow: 'none'
  };

  const buttonHoverStyle: React.CSSProperties = {
    backgroundColor: theme.colors.primary,
    color: theme.colors.background,
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows.md
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: layout === 'horizontal' ? 'row' : 'column',
    gap: theme.spacing.sm,
    alignItems: layout === 'horizontal' ? 'center' : 'stretch',
    ...style
  };

  // Handle button actions
  const handleUndo = async () => {
    if (!disabled && canUndo) {
      try {
        const result = await undo();
        onUndo?.(result);
      } catch (error) {
        onUndo?.({ success: false, error: error instanceof Error ? error.message : 'Undo failed' });
      }
    }
  };

  const handleRedo = async () => {
    if (!disabled && canRedo) {
      try {
        const result = await redo();
        onRedo?.(result);
      } catch (error) {
        onRedo?.({ success: false, error: error instanceof Error ? error.message : 'Redo failed' });
      }
    }
  };

  // Hover state management
  const [undoHovered, setUndoHovered] = useState(false);
  const [redoHovered, setRedoHovered] = useState(false);

  // Icons (using Unicode symbols for simplicity - can be replaced with icon library)
  const UndoIcon = () => (
    <span style={{ fontSize: currentSize.iconSize, lineHeight: 1 }}>↶</span>
  );

  const RedoIcon = () => (
    <span style={{ fontSize: currentSize.iconSize, lineHeight: 1 }}>↷</span>
  );

  return (
    <div 
      className={`qnce-undo-redo-controls ${className}`}
      style={containerStyle}
      role="group"
      aria-label="Undo and redo controls"
    >
      {/* Undo Button */}
      <button
        type="button"
        onClick={handleUndo}
        disabled={disabled || !canUndo}
        style={{
          ...(disabled || !canUndo ? buttonDisabledStyle : buttonBaseStyle),
          ...(undoHovered && !disabled && canUndo ? buttonHoverStyle : {})
        }}
        onMouseEnter={() => setUndoHovered(true)}
        onMouseLeave={() => setUndoHovered(false)}
        onFocus={() => setUndoHovered(true)}
        onBlur={() => setUndoHovered(false)}
        aria-label={`${labels.undo}${undoCount > 0 ? ` (${undoCount} available)` : ''}`}
        title={`${labels.undo}${undoCount > 0 ? ` (${undoCount} available)` : ''}`}
        aria-disabled={disabled || !canUndo}
      >
        <UndoIcon />
        {showLabels && <span>{labels.undo}</span>}
        {undoCount > 0 && (
          <span 
            style={{ 
              fontSize: theme.typography.fontSize.sm,
              opacity: 0.8,
              fontWeight: theme.typography.fontWeight.normal
            }}
          >
            ({undoCount})
          </span>
        )}
      </button>

      {/* Redo Button */}
      <button
        type="button"
        onClick={handleRedo}
        disabled={disabled || !canRedo}
        style={{
          ...(disabled || !canRedo ? buttonDisabledStyle : buttonBaseStyle),
          ...(redoHovered && !disabled && canRedo ? buttonHoverStyle : {})
        }}
        onMouseEnter={() => setRedoHovered(true)}
        onMouseLeave={() => setRedoHovered(false)}
        onFocus={() => setRedoHovered(true)}
        onBlur={() => setRedoHovered(false)}
        aria-label={`${labels.redo}${redoCount > 0 ? ` (${redoCount} available)` : ''}`}
        title={`${labels.redo}${redoCount > 0 ? ` (${redoCount} available)` : ''}`}
        aria-disabled={disabled || !canRedo}
      >
        <RedoIcon />
        {showLabels && <span>{labels.redo}</span>}
        {redoCount > 0 && (
          <span 
            style={{ 
              fontSize: theme.typography.fontSize.sm,
              opacity: 0.8,
              fontWeight: theme.typography.fontWeight.normal
            }}
          >
            ({redoCount})
          </span>
        )}
      </button>
    </div>
  );
};
