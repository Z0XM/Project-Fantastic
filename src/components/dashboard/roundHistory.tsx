import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { capTable } from './data';
import { formatCurrency, formatDateLong } from '@/lib/utils';

export default function RoundHistory() {
  const rounds = capTable.rounds;

  // Sort rounds by date
  const sortedRounds = [...rounds].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare data for the chart
  const chartData = sortedRounds.map((round) => ({
    name: round.name,
    amount: round.amount,
    valuation: round.valuation,
    date: formatDateLong(round.date),
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-sm p-3 border border-gray-100 rounded text-xs">
          <p className="font-medium">{label}</p>
          <p className="text-[hsl(var(--chart-1))]">Amount: {formatCurrency(payload[0].value)}</p>
          {payload[1] && <p className="text-[hsl(var(--chart-2))]">Valuation: {formatCurrency(payload[1].value)}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Funding History</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" name="Amount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="valuation" name="Valuation" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
