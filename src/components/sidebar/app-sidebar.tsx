'use client';

import * as React from 'react';
import { BookOpen, Frame, GalleryVerticalEnd, Map, PieChart, Settings2, SquareTerminal } from 'lucide-react';

import { NavSuper } from './nav-super';
import { NavMagical } from './nav-magical';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAppSelector } from '@/hooks/store';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import Link from 'next/link';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = {
    name: 'Admin',
    email: 'admin@thisisfake.com',
    avatar: '/avatars/shadcn.jpg',
  };
  const business = useAppSelector((state) => state.baseApp.business);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/">
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex justify-center items-center bg-sidebar-primary rounded-lg size-8 aspect-square text-sidebar-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <div className="flex-1 grid text-sm text-left leading-tight">
              <span className="font-semibold truncate">{business?.name}</span>
              <span className="text-xs truncate">Minimizing Complexities</span>
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavSuper
          items={[
            {
              title: 'Dashboards',
              url: '#',
              icon: BookOpen,
              isActive: true,
              items: [
                {
                  title: 'Overview',
                  url: business ? `/business/${business.id}/dashboards/overview` : '#',
                },
                {
                  title: 'Timeline',
                  url: business ? `/business/${business.id}/dashboards/timeline` : '#',
                },
              ],
            },
            {
              title: 'Management',
              url: '#',
              icon: Settings2,
              isActive: true,
              items: [
                {
                  title: 'Events',
                  url: business ? `/business/${business.id}/events` : '#',
                },
                {
                  title: 'Create Event',
                  url: business ? `/business/${business.id}/events/create` : '#',
                },
                { title: 'Stakeholders', url: business ? `/business/${business.id}/stakeholders` : '#' },
              ],
            },
          ]}
        />
        <NavMagical
          projects={[
            {
              name: 'Create Future Plans',
              url: '#',
              icon: Frame,
            },
            {
              name: 'Generate Investor Deck',
              url: '#',
              icon: PieChart,
            },
            {
              name: 'Sumarize Analytics',
              url: '#',
              icon: Map,
            },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton
          size="lg"
          className="flex items-center gap-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="rounded-lg w-8 h-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg">AD</AvatarFallback>
          </Avatar>
          <div className="flex-1 grid text-sm text-left leading-tight">
            <span className="font-semibold truncate">{user.name}</span>
            <span className="text-xs truncate">{user.email}</span>
          </div>
        </SidebarMenuButton>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
