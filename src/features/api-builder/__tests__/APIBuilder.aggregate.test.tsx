import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { APIBuilder } from '../APIBuilder';
import React from 'react';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Lucide icons to avoid rendering issues
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    // Add any specific mocks if needed
  };
});

describe('APIBuilder Aggregate Mode', () => {
  it('renders aggregate mode selection', () => {
    render(<APIBuilder />);
    const aggregateTitle = screen.getByText('buildModes.aggregate.title');
    expect(aggregateTitle).toBeInTheDocument();
  });

  it('navigates to data source step after selecting aggregate mode', () => {
    render(<APIBuilder />);
    const aggregateCard = screen.getByText('buildModes.aggregate.title');
    fireEvent.click(aggregateCard); // Select mode
    
    // Check if mode state is updated (indirectly via UI change if any, or just proceed)
    // The component updates buildMode state.
    
    const nextButton = screen.getByText('nav.next');
    fireEvent.click(nextButton); // Go to step 2
    
    expect(screen.getByText('dataSource.title')).toBeInTheDocument();
  });
});
