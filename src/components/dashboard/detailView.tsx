import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { capTable } from './data';

interface DetailViewProps {
  activeTab: 'shareholders' | 'rounds';
}

export default function DetailView({ activeTab }: DetailViewProps) {
  const { shareholders, rounds } = capTable;

  // Format currency for display
  const formatCurrency = (value?: number) => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat().format(value);
  };

  // Badge color based on shareholder type
  const getShareholderBadgeColor = (type: string) => {
    switch (type) {
      case 'Founder':
        return 'bg-pastel-blue text-slate-800 border-pastel-blue';
      case 'Investor':
        return 'bg-pastel-green text-slate-800 border-pastel-green';
      case 'Employee':
        return 'bg-pastel-peach text-slate-800 border-pastel-peach';
      default:
        return 'bg-pastel-gray text-slate-800 border-pastel-gray';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{activeTab === 'shareholders' ? 'Shareholders' : 'Funding Rounds'}</CardTitle>
      </CardHeader>
      <CardContent>
        {activeTab === 'shareholders' ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Investment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareholders.map((shareholder) => (
                  <TableRow key={shareholder.id}>
                    <TableCell className="font-medium">{shareholder.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getShareholderBadgeColor(shareholder.type)}>
                        {shareholder.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(shareholder.shares)}</TableCell>
                    <TableCell>{shareholder.percentage}%</TableCell>
                    <TableCell>{formatDate(shareholder.joinDate)}</TableCell>
                    <TableCell>{formatCurrency(shareholder.invested)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valuation</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Investors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-medium">{round.name}</TableCell>
                    <TableCell>{formatDate(round.date)}</TableCell>
                    <TableCell>{formatCurrency(round.amount)}</TableCell>
                    <TableCell>{formatCurrency(round.valuation)}</TableCell>
                    <TableCell>{formatNumber(round.shares)}</TableCell>
                    <TableCell>{round.investors.join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
