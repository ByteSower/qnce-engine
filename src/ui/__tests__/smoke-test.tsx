import React from 'react';
import { render } from '@testing-library/react';

// Create a minimal smoke test to isolate the issue
describe('Minimal Component Smoke Test', () => {
  it('should render a simple div', () => {
    const TestComponent = () => <div data-testid="simple-test">Hello</div>;
    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('simple-test')).toBeInTheDocument();
  });

  it('should render a simple button', () => {
    const TestButton = () => <button data-testid="simple-button">Click me</button>;
    const { getByTestId } = render(<TestButton />);
    expect(getByTestId('simple-button')).toBeInTheDocument();
  });
});
