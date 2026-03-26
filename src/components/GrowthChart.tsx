'use client';

import { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { GrowthRecord, MeasureType, PercentileData } from '@/lib/types';
import { getStandardData, calculateAgeInMonths, getMeasureTypeLabel, getMeasureTypeUnit } from '@/lib/growth-standards';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface GrowthChartProps {
  records: GrowthRecord[];
  birthDate: string;
  gender: 'male' | 'female';
  standard: string;
  measureType: MeasureType;
  babyName: string;
}

export default function GrowthChart({ records, birthDate, gender, standard, measureType, babyName }: GrowthChartProps) {
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  const standardData = getStandardData(standard);
  const genderKey = gender === 'male' ? 'boys' : 'girls';
  const percentileData: PercentileData = standardData[measureType][genderKey];

  // Get baby's data points
  const babyPoints = records
    .filter(r => {
      if (measureType === 'weight') return r.weight != null;
      if (measureType === 'height') return r.height != null;
      return r.headCircumference != null;
    })
    .map(r => {
      const ageMonths = calculateAgeInMonths(birthDate, r.date);
      let value: number;
      if (measureType === 'weight') value = r.weight!;
      else if (measureType === 'height') value = r.height!;
      else value = r.headCircumference!;
      return { x: ageMonths, y: value };
    })
    .sort((a, b) => a.x - b.x);

  // Generate chart labels (months)
  const months = percentileData.months;

  // Percentile band colors (light shading)
  const bandColors = [
    'rgba(156, 163, 175, 0.08)', // P1-P3
    'rgba(156, 163, 175, 0.12)', // P3-P15
    'rgba(156, 163, 175, 0.18)', // P15-P50
    'rgba(156, 163, 175, 0.18)', // P50-P85
    'rgba(156, 163, 175, 0.12)', // P85-P97
    'rgba(156, 163, 175, 0.08)', // P97-P99
  ];

  const percentileKeys: (keyof PercentileData)[] = ['P1', 'P3', 'P15', 'P50', 'P85', 'P97', 'P99'];
  const percentileLabels: Record<string, string> = {
    P1: '1%', P3: '3%', P15: '15%', P50: '50%', P85: '85%', P97: '97%', P99: '99%',
  };

  const percentileLineStyles: Record<string, { color: string; width: number; dash: number[] }> = {
    P1:  { color: 'rgba(156, 163, 175, 0.3)', width: 1, dash: [4, 4] },
    P3:  { color: 'rgba(156, 163, 175, 0.5)', width: 1, dash: [4, 4] },
    P15: { color: 'rgba(156, 163, 175, 0.6)', width: 1, dash: [] },
    P50: { color: 'rgba(107, 114, 128, 0.8)', width: 2, dash: [] },
    P85: { color: 'rgba(156, 163, 175, 0.6)', width: 1, dash: [] },
    P97: { color: 'rgba(156, 163, 175, 0.5)', width: 1, dash: [4, 4] },
    P99: { color: 'rgba(156, 163, 175, 0.3)', width: 1, dash: [4, 4] },
  };

  const datasets: ChartData<'line'>['datasets'] = [];

  // Add percentile fill bands (from bottom to top)
  for (let i = 0; i < percentileKeys.length - 1; i++) {
    const key = percentileKeys[i];
    const nextKey = percentileKeys[i + 1];
    datasets.push({
      label: `${percentileLabels[key]}-${percentileLabels[nextKey]}`,
      data: months.map((m, idx) => ({ x: m, y: (percentileData[nextKey] as number[])[idx] })),
      fill: i === 0 ? 'origin' : '-1',
      backgroundColor: bandColors[i],
      borderWidth: 0,
      pointRadius: 0,
      tension: 0.4,
    });
  }

  // Add percentile lines
  percentileKeys.forEach(key => {
    const style = percentileLineStyles[key];
    datasets.push({
      label: percentileLabels[key],
      data: months.map((m, idx) => ({ x: m, y: (percentileData[key] as number[])[idx] })),
      borderColor: style.color,
      borderWidth: style.width,
      borderDash: style.dash,
      pointRadius: 0,
      fill: false,
      tension: 0.4,
    });
  });

  // Add baby's data line
  datasets.push({
    label: babyName,
    data: babyPoints,
    borderColor: 'rgb(239, 68, 68)',
    backgroundColor: 'rgb(239, 68, 68)',
    borderWidth: 2.5,
    pointRadius: 4,
    pointBackgroundColor: 'white',
    pointBorderColor: 'rgb(239, 68, 68)',
    pointBorderWidth: 2,
    fill: false,
    tension: 0.3,
    order: -1, // Draw on top
  });

  const chartData: ChartData<'line'> = { datasets };

  const unit = getMeasureTypeUnit(measureType);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: '年龄 (月)',
          color: '#9CA3AF',
        },
        min: Math.max(0, Math.min(-1, ...babyPoints.map(p => p.x)) - 1),
        max: Math.max(...months, ...babyPoints.map(p => p.x)) + 1,
        ticks: {
          stepSize: 2,
          color: '#9CA3AF',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.15)',
        },
      },
      y: {
        title: {
          display: true,
          text: unit,
          color: '#9CA3AF',
        },
        ticks: {
          color: '#9CA3AF',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.15)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            if (ctx.dataset.label === babyName) {
              return `${babyName}: ${ctx.parsed.y} ${unit} (${(ctx.parsed.x ?? 0).toFixed(1)} 月)`;
            }
            return `${ctx.dataset.label}: ${ctx.parsed.y} ${unit}`;
          },
        },
      },
    },
  };

  // Annotations for percentile labels on right side
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full">
      <h3 className="text-center text-gray-600 dark:text-gray-300 font-medium mb-2">
        {babyName} – {getMeasureTypeLabel(measureType)}
      </h3>
      <div className="relative" style={{ height: '400px' }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      {/* Percentile legend */}
      <div className="flex justify-end gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
        {['P3', 'P15', 'P50', 'P85', 'P97'].map(p => (
          <span key={p}>{percentileLabels[p]}</span>
        ))}
      </div>
    </div>
  );
}
