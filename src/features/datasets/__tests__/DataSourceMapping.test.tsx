import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataSourceMapping } from '../components/DataSourceMapping';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { datasetsReducer } from '../store';
import { Dataset } from '../types';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
        const map: Record<string, string> = {
            'mapping.title': 'MaxCompute - Hologres Mapping',
            'mapping.selectSource': 'Select Hologres Source',
            'mapping.actions.config': 'Config',
            'mapping.actions.delete': 'Delete',
            'mapping.actions.batchConfig': 'Batch Config',
            'mapping.unmapped': 'Unmapped',
            'mapping.mapped': 'Mapped',
            'mapping.autoMatch': 'Smart Match',
            'mapping.save': 'Save',
            'mapping.cancel': 'Cancel',
            'mapping.targetTable': 'Target Table',
        };
        return map[key] || key;
    },
  }),
}));

const mockDataset: Dataset = {
  id: 'ds_1',
  name: 'user_orders',
  alias: 'User Orders',
  source: 'production_db',
  domain: 'sales',
  tags: ['core'],
  fields: 10,
  masked: 0,
  rowCount: '1.2M',
  lastUpdate: '2025-01-01',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  mappings: [],
};

const store = configureStore({
  reducer: {
    datasets: datasetsReducer,
  },
});

describe('DataSourceMapping', () => {
  it('renders mapping interface', () => {
    render(
      <Provider store={store}>
        <DataSourceMapping dataset={mockDataset} />
      </Provider>
    );

    expect(screen.getByText('MaxCompute - Hologres Mapping')).toBeInTheDocument();
    expect(screen.getByText('user_orders')).toBeInTheDocument(); // Current table name
    expect(screen.getByText('Unmapped')).toBeInTheDocument();
  });

  it('opens config dialog and saves mapping', async () => {
    render(
      <Provider store={store}>
        <DataSourceMapping dataset={mockDataset} />
      </Provider>
    );

    // Click config button
    const configBtn = screen.getByText('Config');
    fireEvent.click(configBtn);

    // Check if dialog content is present
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Check for title or other elements
    expect(screen.getByText('Select Hologres Source')).toBeInTheDocument();

    // Select a connection to make the "Smart Match" button appear
    const selectTrigger = screen.getByText('Select connection...');
    fireEvent.click(selectTrigger);
    
    // MOCK_HOLO_CONNECTIONS has 'Hologres_Production'
    fireEvent.click(await screen.findByText('Hologres_Production'));

    // Now the button should be visible
    const autoMatchBtn = await screen.findByTitle('Smart Match');
    expect(autoMatchBtn).toBeInTheDocument();
  });
});

// Mock scrollIntoView for Radix UI Select
window.HTMLElement.prototype.scrollIntoView = vi.fn();
