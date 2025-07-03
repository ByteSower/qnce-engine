// QNCE Error Classes - Sprint 3.2
// Custom error types for robust error handling and debugging

import { Choice } from './core';
import { ValidationResult } from './validation';

/**
 * Base class for all QNCE-specific errors
 */
export class QNCEError extends Error {
  public readonly errorCode: string;
  public readonly timestamp: number;
  public readonly metadata?: Record<string, unknown>;

  constructor(message: string, errorCode: string, metadata?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.timestamp = performance.now();
    this.metadata = metadata;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when navigation to a node fails
 * Used by goToNodeById() and related navigation methods
 */
export class QNCENavigationError extends QNCEError {
  public readonly nodeId?: string;

  constructor(message: string, nodeId?: string, metadata?: Record<string, unknown>) {
    super(message, 'NAVIGATION_ERROR', {
      ...metadata,
      nodeId
    });
    this.nodeId = nodeId;
  }
}

/**
 * Error thrown when choice validation fails
 * Provides detailed information about why the choice is invalid
 */
export class ChoiceValidationError extends QNCEError {
  public readonly choice: Choice;
  public readonly validationResult: ValidationResult;
  public readonly availableChoices?: Choice[];

  constructor(
    choice: Choice, 
    validationResult: ValidationResult, 
    availableChoices?: Choice[]
  ) {
    const message = validationResult.reason || `Choice "${choice.text}" is not valid`;
    
    super(message, 'CHOICE_VALIDATION_ERROR', {
      choiceText: choice.text,
      nextNodeId: choice.nextNodeId,
      failedConditions: validationResult.failedConditions,
      validationMetadata: validationResult.metadata,
      availableChoiceCount: availableChoices?.length || 0
    });

    this.choice = choice;
    this.validationResult = validationResult;
    this.availableChoices = availableChoices;
  }

  /**
   * Get a user-friendly error message with suggestions
   */
  getUserFriendlyMessage(): string {
    let message = this.message;
    
    if (this.availableChoices && this.availableChoices.length > 0) {
      message += `\n\nAvailable choices:`;
      this.availableChoices.forEach((choice, index) => {
        message += `\n  ${index + 1}. ${choice.text}`;
      });
    }

    if (this.validationResult.suggestedChoices) {
      message += `\n\nSuggested alternatives:`;
      this.validationResult.suggestedChoices.forEach((choice, index) => {
        message += `\n  ${index + 1}. ${choice.text}`;
      });
    }

    return message;
  }

  /**
   * Get debugging information for developers
   */
  getDebugInfo(): Record<string, unknown> {
    return {
      error: this.name,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      choice: {
        text: this.choice.text,
        nextNodeId: this.choice.nextNodeId,
        flagEffects: this.choice.flagEffects
      },
      validationResult: this.validationResult,
      availableChoices: this.availableChoices?.map(c => ({
        text: c.text,
        nextNodeId: c.nextNodeId
      })),
      metadata: this.metadata
    };
  }
}

/**
 * Error thrown when story data is invalid or corrupted
 */
export class StoryDataError extends QNCEError {
  public readonly storyId?: string;

  constructor(message: string, storyId?: string, metadata?: Record<string, unknown>) {
    super(message, 'STORY_DATA_ERROR', {
      ...metadata,
      storyId
    });
    this.storyId = storyId;
  }
}

/**
 * Error thrown when engine state becomes inconsistent
 */
export class StateError extends QNCEError {
  public readonly stateSnapshot?: Record<string, unknown>;

  constructor(message: string, stateSnapshot?: Record<string, unknown>) {
    super(message, 'STATE_ERROR', {
      stateSnapshot
    });
    this.stateSnapshot = stateSnapshot;
  }
}

/**
 * Utility function to check if an error is a QNCE error
 */
export function isQNCEError(error: unknown): error is QNCEError {
  return error instanceof QNCEError;
}

/**
 * Utility function to check if an error is a choice validation error
 */
export function isChoiceValidationError(error: unknown): error is ChoiceValidationError {
  return error instanceof ChoiceValidationError;
}

/**
 * Utility function to check if an error is a navigation error
 */
export function isNavigationError(error: unknown): error is QNCENavigationError {
  return error instanceof QNCENavigationError;
}

/**
 * Create a standardized error response for API consumers
 */
export function createErrorResponse(error: unknown): {
  success: false;
  error: {
    name: string;
    message: string;
    code?: string;
    metadata?: Record<string, unknown>;
  };
} {
  if (isQNCEError(error)) {
    return {
      success: false,
      error: {
        name: error.name,
        message: error.message,
        code: error.errorCode,
        metadata: error.metadata
      }
    };
  }

  // Handle non-QNCE errors
  const err = error as Error;
  return {
    success: false,
    error: {
      name: err.name || 'UnknownError',
      message: err.message || 'An unknown error occurred'
    }
  };
}
