import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

import { capTable } from './data';
const chartData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 187, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 90, fill: 'var(--color-other)' },
];
const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  chrome: {
    label: 'Chrome',
    color: 'hsl(var(--chart-1))',
  },
  safari: {
    label: 'Safari',
    color: 'hsl(var(--chart-2))',
  },
  firefox: {
    label: 'Firefox',
    color: 'hsl(var(--chart-3))',
  },
  edge: {
    label: 'Edge',
    color: 'hsl(var(--chart-4))',
  },
  other: {
    label: 'Other',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

const COLORS = {
  Founder: 'hsl(var(--chart-1))', // Vivid Orange
  Investor: 'hsl(var(--chart-2))', // Teal
  Employee: 'hsl(var(--chart-3))', // Dark Blue
  Other: 'hsl(var(--chart-4))', // Yellow
};

export default function ShareholderChart() {
  const shareholders = capTable.shareholders;

  const shareholdersByType = useMemo(() => {
    const groups = shareholders.reduce((acc, shareholder) => {
      if (!acc[shareholder.type]) {
        acc[shareholder.type] = 0;
      }
      acc[shareholder.type] += shareholder.shares;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groups).map(([type, shares]) => ({
      type,
      shares,
      percentage: ((shares / shareholders.reduce((sum, s) => sum + s.shares, 0)) * 100).toFixed(1),
    }));
  }, [shareholders]);

  // Prepare data for the pie chart showing individual shareholders
  const shareholderData = useMemo(() => {
    return shareholders.map((shareholder) => ({
      name: shareholder.name,
      value: shareholder.shares,
      percentage: shareholder.percentage,
      type: shareholder.type,
    }));
  }, [shareholders]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white shadow-sm p-2 border border-gray-100 rounded text-xs">
          <p className="font-medium">{data.name || data.type}</p>
          <p>Shares: {new Intl.NumberFormat().format(data.value || data.shares)}</p>
          <p>{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="gap-5 grid grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equity by Type</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig} className="mx-auto px-0 max-h-[250px] aspect-square">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="visitors" hideLabel />} />
              <Pie
                data={chartData}
                dataKey="visitors"
                labelLine={false}
                label={({ payload, ...props }) => {
                  return (
                    <text
                      cx={props.cx}
                      cy={props.cy}
                      x={props.x}
                      y={props.y}
                      textAnchor={props.textAnchor}
                      dominantBaseline={props.dominantBaseline}
                      fill="hsla(var(--foreground))"
                    >
                      {payload.visitors}
                    </text>
                  );
                }}
                nameKey="browser"
              />
            </PieChart>
          </ChartContainer>
          {/* <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={shareholdersByType}
                dataKey="shares"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={({ type, percentage }) => `${type}: ${percentage}%`}
              >
                {shareholdersByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer> */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shareholder Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={shareholderData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
              >
                {shareholderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
