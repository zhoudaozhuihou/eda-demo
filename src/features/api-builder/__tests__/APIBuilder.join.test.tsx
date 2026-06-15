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

// Mock ResizeObserver (Radix UI often needs it)
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

describe('APIBuilder Join Logic', () => {
  it('enforces join rules and generates aliases', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<APIBuilder />);

    // Step 1: Select Join Mode
    const joinModeCard = screen.getByText('buildModes.join.title');
    await user.click(joinModeCard);
    
    // Click Next to Step 2
    await user.click(screen.getByText('nav.next'));

    // Step 2: Select Connection
    // Open Select
    const connTrigger = screen.getByText('Select Database Connection');
    await user.click(connTrigger);
    
    // Select Option (using queryByText since it might be in a portal)
    const connOption = await screen.findByText('Production DB (MySQL)');
    await user.click(connOption);

    // Select Table
    // Wait for table list to appear
    const tableRow = await screen.findByText('user_orders');
    await user.click(tableRow);
    
    // Wait for "Dataset Linked" alert
    await screen.findByText('Dataset Linked');

    // Click Next to Step 3
    await user.click(screen.getByText('nav.next'));

    // Step 3: Join Mode UI
    // Click Add Join Table
    const addBtn = screen.getByText('join.actions.add');
    await user.click(addBtn);

    // Assert Alias is generated (t1)
    // We use getByDisplayValue to find the input with value 't1'
    const aliasInput = screen.getByDisplayValue('t1');
    expect(aliasInput).toBeInTheDocument();

    // Try to proceed without ON condition
    await user.click(screen.getByText('nav.next'));

    // Expect error toast about missing table (since we didn't select table yet) or ON condition
    // The validation order: Table -> Alias -> ON Condition
    // We haven't selected a table for the join yet.
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Join #1: 未选择表'));

    // Select table for the join
    const joinTableTrigger = screen.getByText('join.fields.table.placeholder');
    await user.click(joinTableTrigger);
    const joinTableOption = await screen.findByText('product_info');
    await user.click(joinTableOption);

    // Try again - now should fail on ON condition
    await user.click(screen.getByText('nav.next'));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('必须包含 ON 条件'));

    // Fill ON condition
    const onInput = screen.getByPlaceholderText('join.fields.onCondition.placeholder');
    await user.type(onInput, 't1.product_id = user_orders.product_id');

    // Click Next - should succeed
    await user.click(screen.getByText('nav.next'));

    // Click Next again to go to SQL step
    await user.click(screen.getByText('nav.next'));

    // Should be on Step 5 (SQL title visible)
    await screen.findByText('sql.title');
  });
});
