'use client';

import Loading from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, formatDateLong, formatEnum, formatNumber } from '@/lib/utils';
import { Briefcase, Plus } from '@phosphor-icons/react';
import {
  BusinessEvents,
  Investments,
  Rounds,
  ShareAllocationType,
  StakeholderEvents,
  Stakeholders,
} from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, CircleDollarSign, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Fragment, useMemo, useState } from 'react';

type Event = Rounds & {
  investments: Pick<Investments, 'amount' | 'stakeholderId'>[];
  businessEvents: BusinessEvents;
  stakeholderEvents: (StakeholderEvents & { stakeholder: { user: { name: string } } })[];
};

export default function EventsPage() {
  const { businessId } = useParams();
  const eventsQuery = useQuery({
    queryKey: ['events', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/events`);
      const data = await response.json();
      return data as Event[];
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 60000,
  });

  const transactions = useMemo(() => {
    if (!eventsQuery.data) return [];
    return eventsQuery.data
      .flatMap((round) => {
        return round.stakeholderEvents?.map((x) => ({ ...x, roundName: round.name })) ?? [];
      })

      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
  }, [eventsQuery.data]);

  const businessHistory = useMemo(() => {
    if (!eventsQuery.data) return [];

    return eventsQuery.data
      .map((round) => {
        if (!round.businessEvents) return null;
        return { ...round.businessEvents, roundName: round.name };
      })
      .filter((x) => x !== null)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
  }, [eventsQuery.data]);

  const roundInvestmentMap = useMemo(() => {
    if (!eventsQuery.data) return {} as { [key: string]: { [key: string]: { amount: number } } };
    return eventsQuery.data.reduce(
      (acc, round) => ({
        ...acc,
        [round.id]: round.investments.reduce(
          (accy, investment) => ({
            ...accy,
            [investment.stakeholderId]: { amount: Number(investment.amount ?? 0) },
          }),
          {} as { [key: string]: { amount: number } }
        ),
      }),
      {} as { [key: string]: { [key: string]: { amount: number } } }
    );
  }, [eventsQuery.data]);

  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({});

  const toggleRound = (roundId: string) => {
    setExpandedRounds((prev) => ({
      ...prev,
      [roundId]: !prev[roundId],
    }));
  };

  if (eventsQuery.isLoading || !eventsQuery.data) {
    return (
      <div className="flex justify-center items-center bg-accent w-full h-full">
        <Loading />
      </div>
    );
  }

  const events = eventsQuery.data;
  const hasEvents = events.length > 0;

  if (!hasEvents) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-full">
        <h1 className="font-bold text-2xl">Events</h1>
        <p className="mt-4 text-lg">No events available at the moment.</p>
        <Link className="mt-4" href={`/business/${businessId}/events/create`}>
          <div className="flex justify-center items-center gap-2 py-2 text-primary text-xl hover:underline underline-offset-2">
            <Plus weight="bold" size={20} /> Create
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white mx-auto p-4 md:p-6 min-h-screen container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-3xl">Company Timeline</h1>
        <Button asChild className="">
          <Link href={`/business/${businessId}/events/create`}>
            <Plus className="mr-2 w-4 h-4" /> Create New Event
          </Link>
        </Button>
      </div>
      <Tabs defaultValue="rounds" className="w-full">
        <TabsList className="grid grid-cols-3 bg-pastel-gray mb-6">
          <TabsTrigger value="rounds" className="flex items-center gap-2 data-[state=active]:bg-pastel-blue">
            <CircleDollarSign className="w-4 h-4" />
            <span>Funding Rounds</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2 data-[state=active]:bg-pastel-green">
            <DollarSign className="w-4 h-4" />
            <span>Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2 data-[state=active]:bg-pastel-peach">
            <Briefcase className="w-4 h-4" />
            <span>Business History</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="rounds" className="space-y-4">
          <Card className="shadow-md border-pastel-blue">
            <CardHeader className="bg-pastel-blue/30">
              <CardTitle>Funding Rounds & Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-pastel-blue/10">
                  <TableRow>
                    <TableHead className="w-[180px]">Round Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Direct Investment</TableHead>
                    <TableHead className="text-right">Post Money Valuation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((round) => {
                    const isExpanded = expandedRounds[round.id] || false;
                    return (
                      <Fragment key={round.id}>
                        <TableRow
                          className="hover:bg-pastel-blue/20 cursor-pointer"
                          onClick={() => toggleRound(round.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {isExpanded ? (
                                <ChevronDown className="mr-2 w-4 h-4 text-blue-500" />
                              ) : (
                                <ChevronRight className="mr-2 w-4 h-4 text-blue-500" />
                              )}
                              <span>{round.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDateLong(formatDate(new Date(round.createdAt)))}</TableCell>
                          <TableCell className="text-right"></TableCell>
                          <TableCell className="text-right"></TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(round.businessEvents.postMoneyValuation ?? 0))}
                          </TableCell>
                        </TableRow>
                        {isExpanded &&
                          round.stakeholderEvents.map((event) => {
                            return (
                              <Fragment key={event.id}>
                                <TableRow className="bg-pastel-blue/10 cursor-pointer">
                                  <TableCell className="pl-8">
                                    <div className="flex items-center">
                                      <span className="flex gap-2">
                                        <Badge variant="outline" className="bg-pastel-green">
                                          {event.eventType}
                                        </Badge>
                                        {event.stakeholder.user.name}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell></TableCell>
                                  <TableCell className="text-right">{formatNumber(-event.shares)}</TableCell>
                                  <TableCell className="text-right">
                                    {roundInvestmentMap[event.roundId]?.[event.stakeholderId]
                                      ? formatCurrency(
                                          Number(roundInvestmentMap[event.roundId][event.stakeholderId].amount ?? 0)
                                        )
                                      : null}
                                  </TableCell>
                                  <TableCell className="text-right"></TableCell>
                                </TableRow>
                              </Fragment>
                            );
                          })}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="shadow-md border-pastel-green">
            <CardHeader className="bg-pastel-green/30">
              <CardTitle>Financial Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-pastel-green/10">
                  <TableRow>
                    <TableHead>Round Name</TableHead>
                    <TableHead>Stakeholder</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>ShareType</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Price Per Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-pastel-green/20">
                      <TableCell>{transaction.roundName}</TableCell>
                      <TableCell>{transaction.stakeholder.user.name}</TableCell>
                      <TableCell>{formatDateLong(formatDate(new Date(transaction.createdAt)))}</TableCell>
                      <TableCell>{formatEnum(transaction.eventType)}</TableCell>
                      <TableCell>{formatEnum(transaction.shareType)}</TableCell>
                      <TableCell>{formatNumber(-1 * transaction.shares)}</TableCell>
                      <TableCell>
                        {transaction.pricePerShare ? formatNumber(Number(transaction.pricePerShare)) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="business" className="space-y-4">
          <Card className="shadow-md border-pastel-peach">
            <CardHeader className="bg-pastel-peach/30">
              <CardTitle>Business Events Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-pastel-peach/10">
                  <TableRow>
                    <TableHead>Round Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Pre Money Valuation</TableHead>
                    <TableHead>Post Money Valuation</TableHead>
                    <TableHead>Balance Shares</TableHead>
                    <TableHead>Total Shares</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessHistory.map((history) => (
                    <TableRow key={history.id} className="hover:bg-pastel-peach/20">
                      <TableCell>{history.roundName}</TableCell>
                      <TableCell>{formatDateLong(formatDate(new Date(history.createdAt)))}</TableCell>
                      <TableCell>{formatCurrency(Number(history.preMoneyValuation ?? 0))}</TableCell>
                      <TableCell>{formatCurrency(Number(history.postMoneyValuation ?? 0))}</TableCell>
                      <TableCell>{formatNumber(Number(history.balanceShares ?? 0))}</TableCell>
                      <TableCell>{formatNumber(Number(history.totalShares ?? 0))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
