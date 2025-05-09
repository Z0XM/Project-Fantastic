'use client';

import { CommandMenu } from '@/components/command-menu';
import Navigator from '@/components/navigator';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';

export default function BusinessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center gap-2 h-16 group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 transition-[width,height] ease-linear shrink-0">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Navigator />
            <SidebarTrigger />
          </div>
        </header>
        <CommandMenu />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
