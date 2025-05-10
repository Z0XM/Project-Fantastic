'use client';

import { CommandMenu } from '@/components/command-menu';
import Navigator from '@/components/navigator';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAppDispatch } from '@/hooks/store';
import { setBusiness } from '@/lib/slices/baseApp';
import { Business } from '@prisma/client';
import { Separator } from '@radix-ui/react-separator';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export default function BusinessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { businessId } = useParams();

  const dispatch = useAppDispatch();

  useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const res = await fetch(`/api/business/${businessId}`);

      const data = await res.json();

      dispatch(setBusiness(data));

      return data as Business;
    },
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="z-10 fixed flex items-center gap-2 bg-accent rounded-md w-full h-16 group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 transition-[width,height] ease-linear shrink-0">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Navigator />
          </div>
        </header>
        <div className="flex-1 pt-12 transition-[padding-top] ease-linear">
          <CommandMenu />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
