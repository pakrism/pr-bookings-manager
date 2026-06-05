import { useMemo } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { CHART_COLORS } from './chartColors';

export function useChart(options) {
  const theme = useTheme();

  return useMemo(() => {
    const base = {
      chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: theme.typography.fontFamily,
        foreColor: theme.palette.text.secondary,
      },
      colors: CHART_COLORS,
      dataLabels: { enabled: false },
      stroke: { width: 3, curve: 'smooth' },
      grid: {
        strokeDashArray: 3,
        borderColor: theme.palette.divider,
        xaxis: { lines: { show: false } },
      },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { fontSize: '12px' } },
      },
      yaxis: {
        labels: { style: { fontSize: '12px' } },
      },
      tooltip: {
        theme: 'light',
        x: { show: true },
      },
      legend: {
        fontSize: '13px',
        position: 'top',
        horizontalAlign: 'right',
        markers: { radius: 12 },
        labels: { colors: theme.palette.text.primary },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '48%',
        },
        pie: {
          donut: { labels: { show: false } },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.72,
          opacityTo: 0.24,
          stops: [0, 90, 100],
        },
      },
    };

    return deepMerge(base, options);
  }, [options, theme]);
}

function deepMerge(target, source) {
  if (!source) return target;
  const output = { ...target };

  Object.keys(source).forEach((key) => {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      output[key] = deepMerge(targetVal, sourceVal);
    } else {
      output[key] = sourceVal;
    }
  });

  return output;
}

export function sparklineOptions(color) {
  return {
    chart: { sparkline: { enabled: true } },
    stroke: { width: 2, curve: 'smooth' },
    fill: {
      type: 'gradient',
      gradient: {
        colorStops: [
          { offset: 0, color, opacity: 0.48 },
          { offset: 100, color, opacity: 0 },
        ],
      },
    },
    tooltip: {
      fixed: { enabled: false },
      x: { show: false },
      marker: { show: false },
    },
  };
}

export function alphaColor(color, opacity) {
  return alpha(color, opacity);
}
