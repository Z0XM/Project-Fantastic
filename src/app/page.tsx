'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import Loading from '@/components/loading';
import { Business } from '@prisma/client/edge';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBar, ChartPie, FileText } from 'lucide-react';

export default function Home() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string>('');

  const router = useRouter();

  const query = useQuery({
    queryKey: ['business-list'],
    queryFn: async () => {
      const res = await fetch('/api/business');
      const data = await res.json();
      return data as Business[];
    },
  });

  if (query.isLoading || !query.data) {
    return (
      <div className="flex justify-center items-center bg-accent h-screen">
        <Loading />
      </div>
    );
  }

  const businesses = query.data;
  const businessMap = businesses.reduce(
    (acc, business) => ({ ...acc, [business.name]: business.id }),
    {} as Record<string, string>
  );

  // return (
  //   <div className="flex justify-center items-center h-screen">
  //     <div className="flex flex-col justify-center gap-2">
  //       <Popover open={open} onOpenChange={setOpen}>
  //         <PopoverTrigger asChild>
  //           <Button
  //             variant="outline"
  //             role="combobox"
  //             aria-expanded={open}
  //             className="justify-between w-[300px] text-xl"
  //           >
  //             {value ? query.data.find((business) => business.name === value)?.name : 'Enter Your Business...'}
  //             <ChevronsUpDown className="opacity-50 ml-2 w-4 h-4 shrink-0" />
  //           </Button>
  //         </PopoverTrigger>
  //         <PopoverContent className="p-0 w-[200px]">
  //           <Command>
  //             <CommandInput placeholder="Enter Your Business..." />
  //             <CommandList>
  //               <CommandEmpty>No business found.</CommandEmpty>
  //               <CommandGroup>
  //                 {query.data.map((business) => (
  //                   <CommandItem
  //                     key={business.name}
  //                     value={business.name}
  //                     onSelect={(currentValue) => {
  //                       setValue(currentValue === value ? '' : currentValue);
  //                       setOpen(false);
  //                     }}
  //                     className="cursor-pointer"
  //                   >
  //                     <Check className={cn('mr-2 h-4 w-4 ', value === business.name ? 'opacity-100' : 'opacity-0')} />
  //                     {business.name}
  //                   </CommandItem>
  //                 ))}
  //               </CommandGroup>
  //             </CommandList>
  //           </Command>
  //         </PopoverContent>
  //       </Popover>
  //       {value ? (
  //         <div>
  //           <Button
  //             onClick={() => {
  //               router.push(`/business/${businessMap[value]}/dashboards/overview`);
  //             }}
  //             className="w-full text-xl"
  //           >
  //             Enter
  //             <ArrowUpRight size={32} />
  //           </Button>
  //         </div>
  //       ) : null}
  //     </div>
  //   </div>
  // );

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="px-6 md:px-12 lg:px-24 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex lg:flex-row flex-col items-center gap-12">
            <div className="space-y-6 lg:w-1/2">
              <h1 className="font-bold text-foreground text-4xl md:text-5xl lg:text-6xl">
                Fantastic Cap Table <span className="text-primary">Management</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Track ownership, analyze equity, and make informed decisions with our intuitive cap table platform.
              </p>
              <div className="flex gap-4 pt-4">
                {/* <Button size="lg">
                  <LayoutDashboard className="mr-2" />
                  Select your Business
                </Button>
                <Button variant="outline" size="lg">
                  <Plus className="mr-2" />
                  New Company
                </Button> */}

                <div className="flex flex-col justify-center gap-2">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="justify-between w-[300px] text-lg"
                      >
                        {value
                          ? query.data.find((business) => business.name === value)?.name
                          : 'Enter Your Business...'}
                        <ChevronsUpDown className="opacity-50 ml-2 w-4 h-4 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[200px]">
                      <Command>
                        <CommandInput placeholder="Enter Your Business..." />
                        <CommandList>
                          <CommandEmpty>No business found.</CommandEmpty>
                          <CommandGroup>
                            {query.data.map((business) => (
                              <CommandItem
                                key={business.name}
                                value={business.name}
                                onSelect={(currentValue) => {
                                  setValue(currentValue === value ? '' : currentValue);
                                  setOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn('mr-2 h-4 w-4 ', value === business.name ? 'opacity-100' : 'opacity-0')}
                                />
                                {business.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {value ? (
                    <div>
                      <Button
                        onClick={() => {
                          router.push(`/business/${businessMap[value]}/dashboards/overview`);
                        }}
                        className="w-full text-lg"
                      >
                        Enter
                        <ArrowUpRight size={32} />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="bg-muted p-6 rounded-lg lg:w-1/2">
              <div className="flex justify-center items-center w-full h-64 sm:h-80">
                <ChartPie className="opacity-80 w-40 h-40 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/20 py-16">
        <div className="mx-auto px-6 md:px-12 max-w-6xl">
          <h2 className="mb-12 font-bold text-3xl text-center">Platform Features</h2>
          <div className="gap-8 grid md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <ChartPie className="mb-2 w-10 h-10 text-primary" />
                <CardTitle>Ownership Tracking</CardTitle>
                <CardDescription>Track all equity holders and their ownership percentages</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Full visibility into your company&apos;s ownership structure with detailed equity breakdowns.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ChartBar className="mb-2 w-10 h-10 text-primary" />
                <CardTitle>Visual Analytics</CardTitle>
                <CardDescription>Visualize your cap table data with beautiful charts</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Interactive charts and graphs to help you understand complex equity structures at a glance.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="mb-2 w-10 h-10 text-primary" />
                <CardTitle>Scenario Modeling</CardTitle>
                <CardDescription>Model future funding rounds and exits</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Create what-if scenarios to understand how future events will impact equity distribution.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t">
        <div className="mx-auto px-6 md:px-12 max-w-6xl">
          <div className="flex md:flex-row flex-col justify-between items-center gap-4">
            <div className="font-semibold text-xl">Project Fantastic</div>
            <div className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Team Malent Tonks. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
