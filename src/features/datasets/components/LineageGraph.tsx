import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTranslation } from 'react-i18next';
import type { Dataset } from '@/features/datasets/types';
import { Card } from '@/app/components/ui/card';

interface LineageGraphProps {
  dataset: Dataset;
  onNodeClick?: (name: string, type: 'dataset' | 'upstream' | 'downstream') => void;
}

export function LineageGraph({ dataset, onNodeClick }: LineageGraphProps) {
  const { t } = useTranslation('datasets');

  const supportsCanvas = useMemo(() => {
    if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return typeof canvas.getContext === 'function' && canvas.getContext('2d') != null;
    } catch {
      return false;
    }
  }, []);

  const option = useMemo(() => {
    const fromWarehouse = /仓库|warehouse/i.test(dataset.source);
    
    // Mock Data Logic matching seedLineage
    const upstreams = fromWarehouse 
      ? ['ODS.user_orders', 'ODS.customer_profile'] 
      : ['prod_mysql.user_orders'];
    
    const downstreams = (dataset.relatedAPIs ?? []).map((a) => `API.${a}`);

    const nodes = [
      // Center Node (Current Dataset)
      {
        name: dataset.name,
        value: dataset.alias || dataset.name,
        category: 1,
        x: 0,
        y: 0,
        symbolSize: 60,
        label: { show: true, position: 'bottom', formatter: '{b}' },
        itemStyle: { color: '#3b82f6' }, // Blue
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const links: any[] = [];

    // Upstream Nodes
    upstreams.forEach((name, idx) => {
      const y = (idx - (upstreams.length - 1) / 2) * 100;
      nodes.push({
        name: name,
        value: name,
        category: 0,
        x: -200,
        y: y,
        symbolSize: 40,
        label: { show: true, position: 'top', formatter: '{b}' },
        itemStyle: { color: '#10b981' }, // Green
      });
      links.push({
        source: name,
        target: dataset.name,
        symbol: ['none', 'arrow'],
      });
    });

    // Downstream Nodes
    if (downstreams.length === 0) {
      nodes.push({
        name: t('lineage.noDownstream', { defaultValue: 'No Downstream' }),
        value: 'None',
        category: 2,
        x: 200,
        y: 0,
        symbolSize: 30,
        label: { show: true, position: 'top', formatter: '{b}' },
        itemStyle: { color: '#9ca3af' }, // Gray
      });
      links.push({
        source: dataset.name,
        target: t('lineage.noDownstream'),
        symbol: ['none', 'none'],
        lineStyle: { type: 'dashed' }
      });
    } else {
      downstreams.forEach((name, idx) => {
        const y = (idx - (downstreams.length - 1) / 2) * 100;
        nodes.push({
          name: name,
          value: name,
          category: 2,
          x: 200,
          y: y,
          symbolSize: 40,
          label: { show: true, position: 'top', formatter: '{b}' },
          itemStyle: { color: '#f59e0b' }, // Amber
        });
        links.push({
          source: dataset.name,
          target: name,
          symbol: ['none', 'arrow'],
        });
      });
    }

    return {
      title: {
        text: t('dialogs.lineage'),
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}',
      },
      legend: {
        data: [t('lineage.upstream'), t('lineage.current'), t('lineage.downstream')],
        bottom: 0,
      },
      series: [
        {
          type: 'graph',
          layout: 'none',
          data: nodes,
          links: links,
          categories: [
            { name: t('lineage.upstream') },
            { name: t('lineage.current') },
            { name: t('lineage.downstream') },
          ],
          roam: true,
          label: {
            show: true,
            position: 'right',
            formatter: '{b}',
          },
          lineStyle: {
            color: 'source',
            curveness: 0.3,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4,
            },
          },
        },
      ],
      animationDurationUpdate: 1500,
      animationEasingUpdate: 'quinticInOut',
    };
  }, [dataset, t]);

  if (!supportsCanvas) {
    return (
      <Card className="w-full h-[500px] p-4 flex flex-col gap-3" aria-label={t('dialogs.lineage')}>
        <div className="text-muted-foreground">{dataset.alias ?? dataset.name}</div>
        <div className="space-y-2 text-sm">
          <div>{t('lineage.upstream')}: {['RawEvents', 'UserProfile'].join(', ')}</div>
          <div>{t('lineage.downstream')}: {dataset.relatedAPIs.join(', ') || t('lineage.noDownstream')}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[500px] p-4">
      <ReactECharts
        option={option} 
        style={{ height: '100%', width: '100%' }} 
        onEvents={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          click: (params: any) => {
            if (onNodeClick && params.dataType === 'node') {
              onNodeClick(params.name, 'dataset');
            }
          }
        }}
      />
    </Card>
  );
}
