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
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col justify-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between w-[300px] text-xl"
            >
              {value ? query.data.find((business) => business.name === value)?.name : 'Enter Your Business...'}
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
                      <Check className={cn('mr-2 h-4 w-4 ', value === business.name ? 'opacity-100' : 'opacity-0')} />
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
                router.push(`/business/${businessMap[value]}`);
              }}
              className="w-full text-xl"
            >
              Enter
              <ArrowUpRight size={32} />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
