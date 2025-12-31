import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from 'i18next';
import { APIBuilder } from '@/features/api-builder/APIBuilder';

describe('APIBuilder i18n', () => {
  it('renders English when language is en-US', async () => {
    await i18n.changeLanguage('en-US');
    render(<APIBuilder />);

    expect(screen.getByRole('heading', { level: 1, name: 'API Builder' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Select build mode' })).toBeInTheDocument();
    expect(screen.getByText('INNER JOIN')).toBeInTheDocument();
  });

  it('renders Chinese when language is zh-CN', async () => {
    await i18n.changeLanguage('zh-CN');
    render(<APIBuilder />);

    expect(screen.getByRole('heading', { level: 1, name: 'API 构建器' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '选择构建模式' })).toBeInTheDocument();
    expect(screen.getByText('INNER JOIN（内连接）')).toBeInTheDocument();
  });
});
