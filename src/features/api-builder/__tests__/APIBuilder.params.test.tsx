import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { APIBuilder } from '../APIBuilder';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock pointer capture methods
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('APIBuilder Params & Config', () => {
  it('allows configuring request params and generating mock', async () => {
    // Skip pointer events check to avoid "pointer-events: none" error in some environments
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<APIBuilder />);

    // Step 1: Default Single Table Mode -> Next
    await user.click(screen.getByText('nav.next'));

    // Step 2: Select Data Source
    // Use getAllByRole('combobox') to find the select trigger.
    // First one should be Connection.
    const selects = screen.getAllByRole('combobox');
    const connTrigger = selects[0];
    await user.click(connTrigger);
    
    // Select 'Production DB (MySQL)'
    const connOption = await screen.findByText('Production DB (MySQL)');
    await user.click(connOption);

    // Select Table 'user_orders' from the list
    // Click the row containing 'user_orders'
    const tableRow = await screen.findByText('user_orders');
    await user.click(tableRow);
    
    // Next -> Step 3 (Fields)
    await user.click(screen.getByText('nav.next'));

    // Next -> Step 4 (API Config - NEW STEP)
    await user.click(screen.getByText('nav.next'));

    // Verify we are on API Config step
    expect(screen.getByText('steps.apiConfig.name')).toBeInTheDocument();

    // 1. Sync Params
    const syncBtn = screen.getByText('Sync from Fields');
    await user.click(syncBtn);
    expect(toast.success).toHaveBeenCalledWith('params.synced');
    
    // Verify params appear (user_id, order_id from default fields)
    expect(screen.getByDisplayValue('user_id')).toBeInTheDocument();

    // 2. Add New Param
    const addBtn = screen.getByText('Add Param');
    await user.click(addBtn);
    
    // Find the new empty input (placeholder param_name)
    const inputs = screen.getAllByPlaceholderText('param_name');
    const newParamInput = inputs[inputs.length - 1];
    await user.type(newParamInput, 'custom_param');
    expect(newParamInput).toHaveValue('custom_param');

    // 3. Switch to Response Tab
    const responseTab = screen.getByText('Response Structure');
    await user.click(responseTab);
    
    // Sync Response
    const syncResBtn = screen.getByText('Sync from Fields');
    await user.click(syncResBtn);
    expect(toast.success).toHaveBeenCalledWith('response.synced');
    
    // Verify response fields
    expect(screen.getByDisplayValue('user_id')).toBeInTheDocument();

    // 4. Switch to Mock Tab
    const mockTab = screen.getByText('Mock Data');
    await user.click(mockTab);
    
    // Generate Mock
    const generateBtn = screen.getByText('Generate Mock');
    await user.click(generateBtn);
    
    // Verify mock data contains keys
    // The mock data is JSON string.
    expect(screen.getByText(/"user_id":/)).toBeInTheDocument();

    // Next -> Step 5 (SQL)
    await user.click(screen.getByText('nav.next'));
    
    // Next -> Step 6 (Release)
    await user.click(screen.getByText('nav.next'));
    
    // Check POST Content Type Selector
    const finalStepSelects = screen.getAllByRole('combobox');
    // The method select is the first combobox in Step 6
    const methodSelect = finalStepSelects[0];
    await user.click(methodSelect);
    
    const postOption = await screen.findByText('POST');
    await user.click(postOption);
    
    // Check if Content Type selector appears
    expect(screen.getByText('Content Type')).toBeInTheDocument();
    
    // Select Content Type
    // Initial value 'application/json' should be displayed.
    expect(screen.getByText('application/json')).toBeInTheDocument();
  });
});
