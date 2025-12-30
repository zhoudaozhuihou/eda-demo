import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Datasets } from '../Datasets';
import { describe, expect, it, vi } from 'vitest';

describe('Datasets', () => {
  it('filters by search and category, and opens detail', async () => {
    const user = userEvent.setup();
    render(<Datasets />);

    expect(screen.getByText('数据集管理')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('搜索数据集名称或别名...'), '用户订单');
    expect(screen.getByText('用户订单表')).toBeInTheDocument();
    expect(screen.queryByText('商品信息表')).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('搜索数据集名称或别名...'));
    await user.click(screen.getByRole('button', { name: /商品域/ }));
    expect(screen.getByText('商品信息表')).toBeInTheDocument();
    expect(screen.queryByText('用户订单表')).not.toBeInTheDocument();

    await user.click(screen.getByText('查看详情 →'));
    expect(screen.getByText('商品信息表')).toBeInTheDocument();
    expect(screen.getByText('字段列表')).toBeInTheDocument();

    await user.click(screen.getByText('查看血缘关系'));
    {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('血缘关系')).toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: '关闭' }));
    }

    await user.click(screen.getByText('变更历史'));
    {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('变更历史')).toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: '关闭' }));
    }

    await user.click(screen.getByText('返回列表'));
    expect(screen.getByText('数据集管理')).toBeInTheDocument();
  });

  it('creates and edits a dataset, then edits a field', async () => {
    const user = userEvent.setup();
    render(<Datasets />);

    const createButtons = screen.getAllByRole('button', { name: '创建数据集' });
    await user.click(createButtons[createButtons.length - 1]);
    {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('创建数据集')).toBeInTheDocument();
    }

    await user.type(screen.getByPlaceholderText('例：user_orders'), 'test_ds');
    await user.type(screen.getByPlaceholderText('例：用户订单表'), '测试数据集');
    await user.type(screen.getByPlaceholderText('例：生产数据库'), '生产数据库');
    {
      const dialog = screen.getByRole('dialog');
      const maskedInput = within(dialog).getAllByDisplayValue('0')[0];
      await user.clear(maskedInput);
      await user.type(maskedInput, '0');
    }
    await user.type(screen.getByPlaceholderText('例：1.2M'), '12K');

    await user.click(screen.getByRole('button', { name: '创建' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    expect(screen.getByText('测试数据集')).toBeInTheDocument();

    const createdCard = screen.getByText('测试数据集').closest('[data-slot="card"]') as HTMLElement;
    const cardButtons = within(createdCard).getAllByRole('button');
    const editButton =
      cardButtons.find((b: HTMLElement) => b.querySelector('svg')) ?? cardButtons[0];
    await user.click(editButton);

    {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('编辑数据集')).toBeInTheDocument();
      const aliasInput = within(dialog).getByDisplayValue('测试数据集');
      await user.clear(aliasInput);
      await user.type(aliasInput, '测试数据集2');
      await user.click(within(dialog).getByRole('button', { name: '保存' }));
    }

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('测试数据集2')).toBeInTheDocument();

    {
      const updatedCard = screen.getByText('测试数据集2').closest('[data-slot="card"]') as HTMLElement;
      await user.click(within(updatedCard).getByRole('button', { name: /查看详情/ }));
    }
    expect(screen.getByText('测试数据集2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '编辑字段' }));
    {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('编辑字段')).toBeInTheDocument();

      const userIdCell = within(dialog).getByText('user_id');
      const userIdRow = userIdCell.parentElement as HTMLElement;
      const fieldAliasInput = within(userIdRow).getAllByRole('textbox')[0] as HTMLInputElement;
      await user.clear(fieldAliasInput);
      await user.type(fieldAliasInput, '用户ID2');
      await user.click(within(dialog).getByRole('button', { name: '保存' }));
    }

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('用户ID2')).toBeInTheDocument();
  });

  it('navigates to API builder with dataset context', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<Datasets />);

    await user.click(screen.getAllByText('查看详情 →')[0]);
    expect(screen.getByRole('heading', { name: '字段列表' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '创建新 API' }));

    const navEvent = dispatchSpy.mock.calls
      .map((c) => c[0])
      .find((e) => (e as Event).type === 'eda:navigate') as CustomEvent | undefined;

    expect(navEvent).toBeTruthy();
    expect(navEvent?.detail?.view).toBe('api-builder');
    expect(navEvent?.detail?.apiBuilderContext?.source).toBe('dataset');
    expect(navEvent?.detail?.apiBuilderContext?.datasetId).toBeTruthy();
    expect(navEvent?.detail?.apiBuilderContext?.datasetName).toBeTruthy();
    expect(Array.isArray(navEvent?.detail?.apiBuilderContext?.fields)).toBe(true);
  });
});
