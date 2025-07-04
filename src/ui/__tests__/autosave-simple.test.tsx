import React from 'react';
import { render } from '@testing-library/react';

// Mock the useAutosave hook
jest.mock('../../integrations/react', () => ({
  useAutosave: jest.fn()
}));

import { useAutosave } from '../../integrations/react';
import { AutosaveIndicator } from '../components/AutosaveIndicator';
import { createQNCEEngine } from '../../engine/core';
import { DEMO_STORY } from '../../engine/demo-story';

const mockUseAutosave = useAutosave as jest.MockedFunction<typeof useAutosave>;

describe('AutosaveIndicator Simple Test', () => {
  it('should render without crashing', () => {
    mockUseAutosave.mockReturnValue({
      autosave: jest.fn().mockResolvedValue(undefined),
      configure: jest.fn(),
      isEnabled: true,
      lastAutosave: new Date(),
      isSaving: false
    });

    const engine = createQNCEEngine(DEMO_STORY);
    const { container } = render(<AutosaveIndicator engine={engine} />);
    
    // Just check that something rendered (not empty)
    expect(container.firstChild).not.toBeNull();
  });
});
