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

// Mock Lucide icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
  };
});

describe('APIBuilder Complex Mode', () => {
  it('renders complex mode selection', () => {
    render(<APIBuilder />);
    const complexTitle = screen.getByText('buildModes.complex.title');
    expect(complexTitle).toBeInTheDocument();
  });

  it('navigates through complex mode steps', () => {
    render(<APIBuilder />);
    const complexCard = screen.getByText('buildModes.complex.title');
    fireEvent.click(complexCard); // Select mode
    
    const nextButton = screen.getByText('nav.next');
    fireEvent.click(nextButton); // Go to step 2
    
    expect(screen.getByText('dataSource.title')).toBeInTheDocument();
  });
});
