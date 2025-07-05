import React, { useState, useEffect, useMemo } from 'react';
import { AutosaveIndicatorProps, AutosaveStatus, defaultTheme, QNCETheme } from '../types';
import { useAutosave } from '../../integrations/react';

/**
 * AutosaveIndicator Component
 * 
 * Visual indicator showing autosave status with animated feedback,
 * timestamp display, and customizable positioning.
 * 
 * Features:
 * - Real-time autosave status updates (idle, saving, saved, error)
 * - Animated visual feedback with spinner and status icons
 * - Configurable positioning (corners, inline)
 * - Timestamp of last successful save
 * - Auto-hide functionality
 * - Accessible with proper ARIA labels
 */
export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  engine,
  theme: customTheme,
  className = '',
  style,
  variant = 'detailed',
  position = 'inline',
  messages = {
    idle: 'Auto-save ready',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Save failed',
    disabled: 'Autosave disabled'
  },
  showTimestamp = true,
  autoHideDelay = 3000
}) => {
  const { isEnabled, lastAutosave, isSaving } = useAutosave(engine);
  const [visible, setVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastSaveSuccessful, setLastSaveSuccessful] = useState(true);

  // Determine status based on hook values
  const status: AutosaveStatus = useMemo(() => {
    if (!isEnabled) return 'disabled';
    if (isSaving) return 'saving';
    if (lastAutosave && !isSaving) {
      return lastSaveSuccessful ? 'saved' : 'error';
    }
    return 'idle';
  }, [isEnabled, isSaving, lastAutosave, lastSaveSuccessful]);

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

  // Auto-hide logic for saved status
  useEffect(() => {
    setVisible(true);
    
    if (status === 'saved' && autoHideDelay > 0) {
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, autoHideDelay);
      
      return () => clearTimeout(hideTimer);
    }
  }, [status, autoHideDelay]);

  useEffect(() => {
    setIsAnimating(isSaving);
  }, [isSaving]);

  // Position styles
  const getPositionStyles = (): React.CSSProperties => {
    const basePositionStyle: React.CSSProperties = {
      position: position === 'inline' ? 'static' : 'fixed',
      zIndex: 1000
    };

    switch (position) {
      case 'top-left':
        return { ...basePositionStyle, top: theme.spacing.md, left: theme.spacing.md };
      case 'top-right':
        return { ...basePositionStyle, top: theme.spacing.md, right: theme.spacing.md };
      case 'bottom-left':
        return { ...basePositionStyle, bottom: theme.spacing.md, left: theme.spacing.md };
      case 'bottom-right':
        return { ...basePositionStyle, bottom: theme.spacing.md, right: theme.spacing.md };
      default:
        return basePositionStyle;
    }
  };

  // Status-based styling
  const getStatusColor = (currentStatus: AutosaveStatus): string => {
    switch (currentStatus) {
      case 'saving':
        return theme.colors.warning;
      case 'saved':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.secondary;
    }
  };

  // Icons and indicators
  const StatusIcon: React.FC<{ status: AutosaveStatus }> = ({ status }) => {
    const iconStyle: React.CSSProperties = {
      fontSize: '16px',
      lineHeight: 1,
      color: getStatusColor(status)
    };

    switch (status) {
      case 'saving':
        return (
          <span 
            style={{
              ...iconStyle,
              animation: isAnimating ? 'spin 1s linear infinite' : 'none'
            }}
          >
            ⟳
          </span>
        );
      case 'saved':
        return <span style={iconStyle}>✓</span>;
      case 'error':
        return <span style={iconStyle}>✗</span>;
      default:
        return <span style={iconStyle}>○</span>;
    }
  };

  // Format timestamp
  const formatTimestamp = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour12: false, timeStyle: 'short' });
  };

  // Component styles
  const containerStyle: React.CSSProperties = {
    display: visible ? 'flex' : 'none',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: variant === 'icon-only' ? theme.spacing.xs : theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    border: `1px solid ${getStatusColor(status)}`,
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    transition: 'all 0.2s ease-in-out',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(-10px)',
    ...getPositionStyles(),
    ...style
  };

  const textStyle: React.CSSProperties = {
    fontWeight: theme.typography.fontWeight.medium,
    color: getStatusColor(status)
  };

  const timestampStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.normal,
    opacity: 0.8
  };

  // Show disabled state when autosave is disabled, otherwise don't render
  if (!isEnabled && status === 'disabled') {
    // Render disabled state
  } else if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* CSS animation keyframes */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div 
        className={`qnce-autosave-indicator qnce-autosave-${status} ${className}`}
        style={containerStyle}
        role="status"
        aria-live="polite"
        aria-label={`Autosave status: ${messages[status as keyof typeof messages] ?? status}`}
      >
        <StatusIcon status={status} />
        {variant !== 'icon-only' && (
          <>
            <span style={textStyle}>
              {messages[status as keyof typeof messages] ?? status}
            </span>
            {showTimestamp && lastAutosave && (
              <span style={timestampStyle}>
                {formatTimestamp(lastAutosave)}
              </span>
            )}
            {showTimestamp && !lastAutosave && (
              <span style={timestampStyle}>
                Never
              </span>
            )}
          </>
        )}
      </div>
    </>
  );
};
