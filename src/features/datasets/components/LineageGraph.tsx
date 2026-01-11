import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTranslation } from 'react-i18next';
import type { Dataset } from '@/features/datasets/types';
import type { ApiCatalogApi } from '@/features/api-catalog/types';
import { Card } from '@/app/components/ui/card';

interface LineageGraphProps {
  data: Dataset | ApiCatalogApi;
  type?: 'dataset' | 'api';
  onNodeClick?: (name: string, type: 'dataset' | 'api' | 'upstream' | 'downstream') => void;
}

export function LineageGraph({ data, type = 'dataset', onNodeClick }: LineageGraphProps) {
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
    let upstreams: string[] = [];
    let downstreams: string[] = [];
    let centerName = '';
    let centerValue = '';

    if (!data) return {};

    if (type === 'dataset') {
      const dataset = data as Dataset;
      centerName = dataset.name;
      centerValue = dataset.alias || dataset.name;
      const fromWarehouse = /仓库|warehouse/i.test(dataset.source || '');
      
      // Mock Data Logic matching seedLineage
      upstreams = fromWarehouse 
        ? ['ODS.user_orders', 'ODS.customer_profile'] 
        : ['prod_mysql.user_orders'];
      
      downstreams = (dataset.relatedAPIs ?? []).map((a) => `API.${a}`);
    } else {
      const api = data as ApiCatalogApi;
      centerName = api.name;
      centerValue = api.path;
      
      // API Upstreams (Datasets)
      upstreams = (api.datasets ?? ['ODS.user_orders', 'ODS.customer_profile']).map(d => `Dataset.${d}`);
      
      // API Downstreams (Apps/Consumers - Mock)
      downstreams = ['Mobile App', 'Web Portal', 'Partner Service'];
    }

    const nodes = [
      // Center Node
      {
        name: centerName,
        value: centerValue,
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
        target: centerName,
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
        source: centerName,
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
          source: centerName,
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
  }, [data, type, t]);

  if (!data) {
    return (
      <Card className="w-full h-[500px] p-4 flex items-center justify-center text-muted-foreground">
        {t('lineage.noData', { defaultValue: 'No data available' })}
      </Card>
    );
  }

  if (!supportsCanvas) {
    const name = type === 'dataset' ? (data as Dataset).alias || (data as Dataset).name : (data as ApiCatalogApi).name;
    
    return (
      <Card className="w-full h-[500px] p-4 flex flex-col gap-3" aria-label={t('dialogs.lineage')}>
        <div className="text-muted-foreground">{name}</div>
        <div className="space-y-2 text-sm">
          <div>{t('lineage.upstream')}</div>
          <div>{t('lineage.downstream')}</div>
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
              onNodeClick(params.name, type);
            }
          }
        }}
      />
    </Card>
  );
}
