'use client';

import Loading from '@/components/loading';
import { Plus } from '@phosphor-icons/react';
import { BusinessEvents, Investments, Rounds, StakeholderEvents, Stakeholders } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Event = Rounds & {
  investments: (Investments & { stakeholder: Stakeholders & { user: { name: string } } })[];
  businessEvents: BusinessEvents[];
  stakeHolderEvents: (StakeholderEvents & { stakeholder: Stakeholders & { user: { name: string } } })[];
};

export default function EventsPage() {
  const { businessId } = useParams();
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/events`);
      const data = await response.json();
      return data as Event[];
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 60000,
  });

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

  return <></>;
}
