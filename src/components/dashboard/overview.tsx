import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Database } from 'lucide-react';
import { capTable } from './data';

export default function Overview() {
  const { totalShares, totalValuation, shareholders, rounds } = capTable;

  // Calculate total investment
  const totalInvestment = rounds.reduce((sum, round) => sum + round.amount, 0);

  // Format numbers for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="gap-5 grid grid-cols-1 md:grid-cols-3">
      <Card className="bg-pastel-blue">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center font-medium text-sm">
            <Users size={16} className="mr-2" />
            Shareholders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{shareholders.length}</div>
          <p className="mt-1 text-muted-foreground text-xs">
            {shareholders.filter((s) => s.type === 'Investor').length} Investors,{' '}
            {shareholders.filter((s) => s.type === 'Founder').length} Founders
          </p>
        </CardContent>
      </Card>

      <Card className="bg-pastel-green/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center font-medium text-sm">
            <TrendingUp size={16} className="mr-2" />
            Valuation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{formatCurrency(totalValuation)}</div>
          <p className="mt-1 text-muted-foreground text-xs">{formatCurrency(totalInvestment)} Total Investment</p>
        </CardContent>
      </Card>

      <Card className="bg-pastel-peach/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center font-medium text-sm">
            <Database size={16} className="mr-2" />
            Shares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{formatNumber(totalShares)}</div>
          <p className="mt-1 text-muted-foreground text-xs">{rounds.length} Funding Rounds</p>
        </CardContent>
      </Card>
    </div>
  );
}
