'use client';

import AllocateShares from '@/components/events/allocate-shares';
import GrantExit from '@/components/events/grant-exit';
import IssueContracts from '@/components/events/issue-contract';
import EventRaiseARound from '@/components/events/raise-a-round';
import WarrantNOptions from '@/components/events/warrant-n-options';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, Award, ExternalLinkIcon, FileText, Users } from 'lucide-react';
import { useState } from 'react';

const eventTypes = [
  {
    icon: ArrowUp,
    title: 'Raise a Round',
    type: 'raise-round',
    description: 'Create a new funding round and allocate shares to investors',
    color: 'bg-pastel-purple', // Soft Purple
    iconColor: 'text-purple-600',
  },
  {
    icon: Award,
    title: 'Grant Warrants or Options',
    type: 'warrant-options',
    description: 'Issue stock options or warrants to emplosyees or advisors',
    color: 'bg-pastel-pink', // Soft Pink
    iconColor: 'text-pink-500',
  },
  {
    icon: Users,
    title: 'Allocate New Shares',
    type: 'allocate-shares',
    description: 'Create and allocate new shares to existing or new shareholders',
    color: 'bg-pastel-green', // Soft Green
    iconColor: 'text-green-600',
  },
  {
    icon: FileText,
    title: 'Issue Existing Contracts',
    type: 'issue-contracts',
    description: 'Process existing agreements and update your cap table',
    color: 'bg-pastel-blue', // Soft Blue
    iconColor: 'text-blue-500',
  },
  {
    icon: ExternalLinkIcon,
    title: 'Grant EXit',
    type: 'grant-exit',
    description: 'Grant exit to existing shareholders',
    color: 'bg-pastel-rose', // Soft Blue
    iconColor: 'text-pink-500',
  },
];

export default function EventCreatePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [event, setEvent] = useState<(typeof eventTypes)[0] | undefined>(undefined);

  return (
    <main className="bg-background">
      <div className="mx-auto px-6 pt-6 max-w-7xl">
        <div className="mb-10 md:text-left text-center">
          <h1 className="mb-3 font-bold text-foreground text-2xl tracking-tight">Create Event</h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Create a new event for your business. This event will be used to track important milestones and activities.
          </p>
        </div>
        <div className="gap-8 grid grid-cols-1 md:grid-cols-2">
          {eventTypes.map((event, index) => (
            <div
              key={index}
              onClick={(e) => {
                e.preventDefault();
                setEvent(event);
                setIsDialogOpen(true);
              }}
              className="cursor-pointer"
            >
              <Card
                className={`h-full border shadow-sm transition-all duration-300 ${event.color}  hover:shadow-md hover:scale-[1.02] overflow-hidden transform`}
              >
                <CardContent className="flex flex-col px-8 py-2 h-full">
                  <div
                    className={`mb-6 rounded-full w-16 h-4 flex items-center justify-center ${event.color.replace(
                      '/50',
                      ''
                    )} ${event.iconColor}`}
                  >
                    <event.icon className="w-8 h-8" />
                  </div>

                  <div className="space-y-4">
                    <h2 className="font-semibold text-2xl">{event.title}</h2>
                    <p className="flex-grow text-muted-foreground text-base">{event.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
      {event?.type === 'raise-round' ? (
        <EventRaiseARound
          backgroundColor={event?.color}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
        />
      ) : null}
      {event?.type === 'warrant-options' ? (
        <WarrantNOptions backgroundColor={event?.color} isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      ) : null}
      {event?.type === 'allocate-shares' ? (
        <AllocateShares backgroundColor={event?.color} isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      ) : null}
      {event?.type === 'issue-contracts' ? (
        <IssueContracts backgroundColor={event?.color} isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      ) : null}
      {event?.type === 'grant-exit' ? (
        <GrantExit backgroundColor={event?.color} isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      ) : null}
    </main>
  );
}
