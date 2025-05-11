'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/store';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { setMultipleContext } from '@/lib/slices/aiContext';
import { BusinessEvents, Stakeholders, StakeholderType } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Users } from '@phosphor-icons/react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from 'recharts';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

export default function BusinessPage() {
  const { businessId } = useParams();

  const business = useAppSelector((state) => state.baseApp.business);
  const dispatch = useAppDispatch();
  const businessInfoQuery = useQuery({
    queryKey: ['businessInfo', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/info`);
      const data = await response.json();
      return (data.businessInfo ?? null) as BusinessEvents | null;
    },
  });
  const businessInfo = businessInfoQuery.data;

  const businessEventsQuery = useQuery({
    queryKey: ['events', businessId, 'business-by-month'],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/events/business-by-month`);
      const data = await response.json();
      return (
        (data as { month: string; firstValuation: number; lastValuation: number; totalInvestment: number }[]) ?? []
      );
    },
  });

  const businessEvents = businessEventsQuery?.data ?? [];

  const stakeholdersQuery = useQuery({
    queryKey: ['stakeholders', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/stakeholders`);
      const data = await response.json();

      dispatch(
        setMultipleContext([
          {
            key: 'stakeholders',
            contextString: `This is a list of all stakeholders in the company ${JSON.stringify(data.stakeholders)}`,
            rawValue: data.stakeholders,
          },
          {
            key: 'totalOwnershipShares',
            contextString: `${data.totalOwnershipShares} is the total no. of shares with the stakeholders which grant ownership in the company`,
            rawValue: data.totalOwnershipShares,
          },
          {
            key: 'totalOwnedShares',
            contextString: `${data.totalOwnedShares} is the total no. of shares with stakeholders`,
            rawValue: data.totalOwnedShares,
          },
          {
            key: 'totalShares',
            contextString: `${Number(businessInfo?.totalShares ?? 0)} is the total no. of shares in the company`,
            rawValue: Number(businessInfo?.totalShares ?? 0),
          },
          {
            key: 'balanceShares',
            contextString: `${Number(
              businessInfo?.balanceShares ?? 0
            )} is the total no. of balance shares in the company`,
            rawValue: Number(businessInfo?.balanceShares ?? 0),
          },
          {
            key: 'currentValuation',
            contextString: `${Number(businessInfo?.postMoneyValuation ?? 0)} is the current valuation of the company`,
            rawValue: Number(businessInfo?.postMoneyValuation ?? 0),
          },
          {
            key: 'totalInvestment',
            contextString: `${data.totalInvestment} is the total amount invested by the stakeholders in the company`,
            rawValue: data.totalInvestment,
          },
        ])
      );

      return data as {
        totalOwnershipShares: number;
        totalOwnedShares: number;
        totalInvestment: number;
        stakeholders: (Stakeholders & {
          name: string;
          totalInvestment: number;
          ownedShares: number;
          ownershipShares: number;
          promisedShares: number;
          stockValue: number;
        })[];
      };
    },
  });

  const stakeholders = stakeholdersQuery.data?.stakeholders ?? [];
  const totalOwnershipShares = stakeholdersQuery.data?.totalOwnershipShares ?? 0;
  const totalOwnedShares = stakeholdersQuery.data?.totalOwnedShares ?? 0;
  const totalInvestment = stakeholdersQuery.data?.totalInvestment ?? 0;

  const [splitChartType, setSplitChartType] = useState<'equity' | 'ownership'>('equity');

  return (
    <div className="bg-gray-50">
      {/* <Navbar /> */}

      <main className="mx-auto px-4 py-6 container">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-bold text-2xl">{business?.name ?? ''}</h1>
            <p className="text-muted-foreground text-sm">Cap Table Dashboard</p>
          </div>
          <div className="text-sm text-right">
            <div className="font-medium">Last Updated</div>
            <div className="text-muted-foreground">
              {business
                ? new Date(business.updatedAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : ''}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="gap-5 grid grid-cols-1 md:grid-cols-3">
            <Card className="bg-pastel-blue">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center font-medium text-sm">
                  <Users size={16} className="mr-2" />
                  Stakeholders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stakeholders.length}</div>
                <p className="mt-1 text-muted-foreground text-xs">
                  {stakeholders.filter((s) => s.type === StakeholderType.FOUNDING_TEAM).length} Founders,{' '}
                  {
                    stakeholders.filter(
                      (s) => s.type !== StakeholderType.FOUNDING_TEAM && s.type !== StakeholderType.EMPLOYEE
                    ).length
                  }{' '}
                  Investors, {stakeholders.filter((s) => s.type === StakeholderType.EMPLOYEE).length} Employees,
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
                <div className="font-bold text-2xl">
                  {formatCurrency(Number(businessInfo?.postMoneyValuation ?? 0))}
                </div>
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
                <div className="font-bold text-2xl">
                  {formatNumber(Number(businessInfo?.balanceShares ?? 0))} /{' '}
                  {formatNumber(Number(businessInfo?.totalShares ?? 0))}
                </div>
                <p className="mt-1 text-muted-foreground text-xs">Balance / Total</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <div className="gap-5 grid grid-cols-1 md:grid-cols-2">
              {splitChartType === 'equity' ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center w-full text-lg justify=between">
                      <Switch
                        className="mr-4"
                        checked={false}
                        onCheckedChange={(val) => setSplitChartType(val ? 'ownership' : 'equity')}
                      />
                      <span>Equity Split %</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="mx-auto px-0 max-h-[350px] aspect-square">
                      <PieChart>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name, payload) => {
                                console.log(payload);
                                return (
                                  <span className="flex items-center gap-2">
                                    <div
                                      style={{ backgroundColor: payload.payload.fill }}
                                      className="w-[10px] h-[10px] -400"
                                    ></div>
                                    <div className="flex gap-4">
                                      {name} <span>{formatNumber(Number(value))} %</span>
                                    </div>
                                  </span>
                                );
                              }}
                              nameKey="ownedSharesPercent"
                              hideLabel
                            />
                          }
                        />
                        <Pie
                          data={stakeholders.map((x) => ({
                            ...x,
                            ownedSharesPercent: 100 * (x.ownedShares / totalOwnedShares),
                          }))}
                          dataKey="ownedSharesPercent"
                          nameKey="name"
                          labelLine={false}
                          fill="#8884d8"
                        >
                          {stakeholders.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                [
                                  'hsl(var(--chart-1))',
                                  'hsl(var(--chart-2))',
                                  'hsl(var(--chart-3))',
                                  'hsl(var(--chart-4))',
                                  'hsl(var(--chart-5))',
                                ][index % 5]
                              }
                            />
                          ))}
                        </Pie>
                        <ChartLegend
                          content={<ChartLegendContent nameKey="name" />}
                          className="flex-wrap [&>*]:justify-center gap-2 -translate-y-2 [&>*]:basis-1/4"
                        />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center w-full text-lg justify=between">
                      <Switch
                        className="mr-4"
                        checked={true}
                        onCheckedChange={(val) => setSplitChartType(val ? 'ownership' : 'equity')}
                      />
                      <span>Ownership Split %</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="mx-auto px-0 max-h-[350px] aspect-square">
                      <PieChart>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name, payload) => {
                                return (
                                  <span className="flex items-center gap-4">
                                    <div
                                      style={{ backgroundColor: payload.payload.fill }}
                                      className="w-[10px] h-[10px] -400"
                                    ></div>
                                    <div className="flex gap-4">
                                      {name} <span>{formatNumber(Number(value))} %</span>
                                    </div>
                                  </span>
                                );
                              }}
                              nameKey="ownershipSharesPercent"
                              hideLabel
                            />
                          }
                        />
                        <Pie
                          data={stakeholders.map((x) => ({
                            ...x,
                            ownershipSharesPercent: 100 * (x.ownershipShares / totalOwnedShares),
                          }))}
                          dataKey="ownershipSharesPercent"
                          nameKey="name"
                          labelLine={false}
                          fill="#8884d8"
                        >
                          {stakeholders.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                [
                                  'hsl(var(--chart-1))',
                                  'hsl(var(--chart-2))',
                                  'hsl(var(--chart-3))',
                                  'hsl(var(--chart-4))',
                                  'hsl(var(--chart-5))',
                                ][index % 5]
                              }
                            />
                          ))}
                        </Pie>
                        <ChartLegend
                          content={<ChartLegendContent nameKey="name" />}
                          className="flex-wrap [&>*]:justify-center gap-2 -translate-y-2 [&>*]:basis-1/4"
                        />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Growth</CardTitle>
                  {/* <CardDescription>Showing total visitors for the last 6 months</CardDescription> */}
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}}>
                    <AreaChart
                      accessibilityLayer
                      data={businessEvents}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, payload) => {
                              return (
                                <span className="flex items-center gap-2">
                                  <div
                                    style={{ backgroundColor: payload.color }}
                                    className="w-[10px] h-[10px] -400"
                                  ></div>
                                  <div className="flex gap-4">
                                    {name} {formatCurrency(Number(value))}
                                  </div>
                                </span>
                              );
                            }}
                          />
                        }
                      />
                      <defs>
                        <linearGradient id="filllastValuation" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="fillfirstValuation" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="filltotalInvestment" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <Area
                        dataKey="lastValuation"
                        type="natural"
                        fill="url(#filllastValuation)"
                        fillOpacity={0.4}
                        stroke="hsl(var(--chart-1))"
                        stackId="a"
                        name="Last Valuation"
                      />
                      <Area
                        dataKey="firstValuation"
                        type="natural"
                        fill="url(#fillfirstValuation)"
                        fillOpacity={0.4}
                        stroke="hsl(var(--chart-2))"
                        stackId="b"
                        name="First Valuation"
                      />
                      <Area
                        dataKey="totalInvestment"
                        type="natural"
                        fill="url(#filltotalInvestment)"
                        fillOpacity={0.4}
                        stroke="hsl(var(--chart-3))"
                        stackId="c"
                        name="Total Investment"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
