'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useParams } from 'next/navigation';
import { BusinessEvents } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import Loading from '@/components/loading';
import { formatDate, formatDateLong, formatEnum, formatNumber } from '@/lib/utils';

export default function Timeline() {
  const { businessId } = useParams();
  const businessInfoQuery = useQuery({
    queryKey: ['businessInfo', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/info`);
      const data = await response.json();
      return (data.businessInfo ?? null) as BusinessEvents | null;
    },
  });
  const businessInfo = businessInfoQuery.data;

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [sliderVal, setSliderVal] = useState(0);
  const [dates, setDates] = useState<number[]>([]);

  const timelineQuery = useQuery({
    queryKey: ['timeline', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/events/timeline`);
      const data = await response.json();
      setDates(Object.keys(data).map((x) => Number(x)));
      setSelectedDateIndex(Object.keys(data).length - 1);
      setSliderVal(99);
      return data as {
        [key: string]: {
          preMoneyValuation: number;
          postMoneyValuation: number;
          totalShares: number;
          pricePerShare: number;
          balanceShares: number;
          directInvestment: number;
          contractInvestment: number;
          stakeholderMap: {
            [key: string]: { name: string; shares: number; promisedShares: number };
          };
        };
      };
    },
  });

  const timelineGrowthChart = useMemo(() => {
    const date = dates[selectedDateIndex];
    const data = (timelineQuery.data ?? {})[date];
    if (!data) return [];
    const chartData = Object.entries(data)
      .filter(([key]) => key !== 'stakeholderMap')
      .map(([key, value]) => ({
        name: key,
        value: value,
        fill: `var(--color-${key})`,
      }));
    return chartData;
  }, [timelineQuery.data, selectedDateIndex, dates]);

  const timelineShareChart = useMemo(() => {
    const stakeholderMap: { [key: string]: { name: string; shares: number } } = {};

    for (let i = 0; i <= selectedDateIndex; i++) {
      const date = dates[i];
      const data = (timelineQuery.data ?? {})[date];
      if (!data) return [];

      Object.values(data.stakeholderMap).forEach((value) => {
        if (!stakeholderMap[value.name]) {
          stakeholderMap[value.name] = {
            name: value.name,
            shares: 0,
          };
        }
        stakeholderMap[value.name] = {
          name: value.name,
          shares: stakeholderMap[value.name].shares + value.shares,
        };
      });
    }

    const chartData = Object.values(stakeholderMap).map((value) => ({
      name: value.name,
      shares: value.shares,
      //   promisedShares: value.promisedShares,
      //   fill: `var(--color-${value.name})`,
    }));
    return chartData;
  }, [timelineQuery.data, selectedDateIndex, dates]);

  if (timelineQuery.isLoading || !timelineQuery.data) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <Loading />
      </div>
    );
  }

  const timeline = timelineQuery.data ?? {};

  return (
    <div
      className="mx-auto p-4 md:p-6 container"
      onWheel={(e) => {
        // e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        const currentValue = sliderVal;
        const newValue = Math.max(0, Math.min(99, sliderVal + delta * dates.length));
        const dateIndex = Math.floor(newValue / (100 / dates.length));
        setSelectedDateIndex(dateIndex);
        setSliderVal(newValue);
      }}
    >
      <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="mb-2 font-bold text-3xl">Timeline View</h1>
          <p className="text-muted-foreground">Visualize changes in equity and valuation over time</p>
        </div>
        <div className="flex items-center gap-2 bg-pastel-purple/20 shadow-sm px-4 py-2 rounded-lg">
          <span className="font-medium text-sm">Selected Date:</span>
          <span className="font-bold text-lg">{formatDateLong(formatDate(new Date(dates[selectedDateIndex])))}</span>
        </div>
      </div>

      <div className="gap-8 grid grid-cols-[1fr_1fr_120px]">
        {/* Equity Distribution Chart */}
        <Card className="shadow-md border-pastel-blue/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-pastel-blue to-pastel-blue/50 border-b">
            <CardTitle className="text-lg">Equity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-b from-white to-pastel-blue/10 pt-6">
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
                      nameKey="shares"
                      hideLabel
                    />
                  }
                />
                <Pie data={timelineShareChart} dataKey="shares" nameKey="name" labelLine={false} fill="#8884d8">
                  {timelineShareChart.map((entry, index) => (
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

        {/* Valuation Growth Chart */}
        <Card className="shadow-md border-pastel-green/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-pastel-green to-pastel-green/50 border-b">
            <CardTitle className="text-lg">Business Valuation Growth</CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-b from-white to-pastel-green/10 pt-6">
            <ChartContainer
              config={{
                preMoneyValuation: {
                  label: 'Pre-Money Valuation',
                  color: 'hsl(var(--chart-1))',
                },
                postMoneyValuation: {
                  label: 'Post-Money Valuation',
                  color: 'hsl(var(--chart-2))',
                },
                totalShares: {
                  label: 'Total Shares',
                  color: 'hsl(var(--chart-3))',
                },
                pricePerShare: {
                  label: 'Price Per Share',
                  color: 'hsl(var(--chart-4))',
                },
                balanceShares: {
                  label: 'Balance Shares',
                  color: 'hsl(var(--chart-5))',
                },
                directInvestment: {
                  label: 'Direct Investment',
                  color: 'hsl(var(--chart-1))',
                },
                contractInvestment: {
                  label: 'Contract Valuation',
                  color: 'hsl(var(--chart-2))',
                },
              }}
            >
              <BarChart
                accessibilityLayer
                data={timelineGrowthChart}
                layout="vertical"
                margin={{
                  right: 16,
                }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                  hide
                />
                <XAxis dataKey="value" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="value" layout="vertical" radius={4}>
                  <LabelList
                    dataKey="name"
                    position="insideLeft"
                    offset={8}
                    formatter={(v: string) => {
                      const nameMap: { [key: string]: string } = {
                        preMoneyValuation: 'Pre-Money Valuation',
                        postMoneyValuation: 'Post-Money Valuation',
                        totalShares: 'Total Shares',
                        pricePerShare: 'Price Per Share',
                        balanceShares: 'Balance Shares',
                        directInvestment: 'Direct Investment',
                        contractInvestment: 'Contract Investment',
                      };
                      return `${nameMap[v]}`;
                    }}
                    className="fill-black"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Vertical Timeline Slider */}
        <div className="flex flex-col items-center bg-white shadow-md p-4 border border-pastel-purple/30 rounded-xl">
          <div className="bg-pastel-purple mb-4 px-3 py-1.5 rounded-md w-full font-medium text-sm text-center">
            {formatDateLong(formatDate(new Date(dates[selectedDateIndex])))}
          </div>
          <div className="flex items-center bg-gradient-to-b from-pastel-blue/20 via-pastel-purple/20 to-pastel-green/20 px-6 py-8 rounded-lg h-full">
            <Slider
              //   value={[Math.floor(selectedDateIndex * (100 / dates.length))]}
              value={[sliderVal]}
              onValueChange={(value) => {
                const dateIndex = Math.floor(value[0] / (100 / dates.length));
                setSelectedDateIndex(dateIndex);
                setSliderVal(value[0]);
              }}
              orientation="vertical"
              step={1}
              min={0}
              max={99}
              className="cursor-pointer"
            />
          </div>
          <div className="bg-pastel-blue mt-4 px-3 py-1.5 rounded-md w-full font-medium text-sm text-center">
            {formatDateLong(formatDate(new Date(Math.min(...dates))))}
          </div>
        </div>
      </div>
    </div>
  );
}
