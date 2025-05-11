'use client';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, FilePlus, File } from 'lucide-react';
import { cn, formatCurrency, formatDate, formatEnum, formatNumber } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { BusinessEvents, Contracts, ContractType, RoundType, ShareType, Stakeholders } from '@prisma/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

const formSchema = z.object({
  round: z.object({
    name: z.string().min(1, { message: 'Round name is required' }),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    contractId: z.string().min(1, { message: 'Contract is required' }),
    shares: z.coerce.number().min(1, { message: 'Shares are required' }),
  }),
  dilutions: z.array(
    z.object({
      stakeholderId: z.string().min(1, { message: 'Dilution stakeholder name is required' }),
      shares: z.coerce.number().min(0, { message: 'Dilution stakeholder shares are required' }),
    })
  ),
});

export default function IssueContracts({
  isDialogOpen,
  setIsDialogOpen,
  backgroundColor,
}: {
  backgroundColor?: string;
  isDialogOpen: boolean;
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { businessId } = useParams();

  const businessInfoQuery = useQuery({
    queryKey: ['businessInfo', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/info`);
      const data = await response.json();
      return (data.businessInfo ?? null) as BusinessEvents | null;
    },
  });

  const contractsQuery = useQuery({
    queryKey: ['contracts', businessId, 'PENDING'],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/contracts/PENDING'`);
      const data = await response.json();
      return data as Contracts[];
    },
  });

  const contracts = contractsQuery.data ?? [];

  const businessInfo = businessInfoQuery.data;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: async (data, context, options) => {
      const result = await zodResolver(formSchema)(data, context, options);
      if (result.errors) {
        console.info('Form validation errors:', result.errors);
      }
      return result;
    },
    // resolver: zodResolver(formSchema),
    defaultValues: {
      round: {
        name: '',
        date: formatDate(new Date()),
        shares: 0,
        contractId: '',
      },
      dilutions: [],
    },
  });

  const queryClient = useQueryClient();

  const raiseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      await fetch(`/api/business/${businessId}/events/issue-contract`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast.success('Contract Issued successfully!');
      queryClient.invalidateQueries({ queryKey: ['businessInfo', businessId] });
      queryClient.invalidateQueries({ queryKey: ['stakeholders', businessId] });
      queryClient.invalidateQueries({ queryKey: ['events', businessId] });
      queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
    onError: (error) => {
      toast.error(`Error allocating shares!`);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const balanceShares =
      Number(businessInfo?.balanceShares ?? 0) -
      Number(values.round.shares ?? 0) +
      Number(values.dilutions.reduce((acc, dilution) => acc + Number(dilution.shares), 0));

    if (balanceShares < 0) {
      toast.error('Shares allocated exceed available shares!');
      return;
    }
    raiseMutation.mutate(values);
    setIsDialogOpen(false);
    form.reset();
  };

  const contractMap: { [key: string]: Contracts } = {};
  contracts.forEach((contract) => {
    contractMap[contract.id] = contract;
  });

  const stakeholdersMinQuery = useQuery({
    queryKey: ['stakeholders', businessId, 'min'],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/stakeholders/min`);
      const data = await response.json();
      return data as (Stakeholders & { name: string; hasStakes: boolean })[];
    },
  });

  const stakeholders = stakeholdersMinQuery.data ?? [];

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className={cn('bg-accent sm:max-w-[900px] max-h-[90vh] overflow-y-auto', backgroundColor)}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} onReset={() => setIsDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle className="text-foreground text-2xl">Issue a contract</DialogTitle>
              <DialogDescription>
                Enter the details of the contact to issue. This will update your cap table with the new investor
                allocations.
              </DialogDescription>
            </DialogHeader>

            <div className="gap-8 grid my-4">
              <Card className="shadow-md border-none overflow-hidden">
                <CardHeader className="z-10 relative">
                  <CardTitle>Round Details</CardTitle>
                  <CardDescription>Enter the details of this investment round</CardDescription>
                </CardHeader>
                <CardContent className="z-10 relative">
                  <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="round.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Round Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Series A" {...field} />
                          </FormControl>
                          <FormDescription>This is the name of the round.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="round.date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Round Date</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant={'outline'} className="cursor-pointer">
                                  {field.value}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 w-auto" align="start">
                                <CalendarComponent
                                  mode="single"
                                  onSelect={(date) => date && field.onChange(formatDate(new Date(date)))}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormDescription>Date on which round was raised.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="round.contractId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} {...field}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Contract" {...field} />
                              </SelectTrigger>
                              <SelectContent>
                                {contracts
                                  .sort((a, b) => a.title.localeCompare(b.title))
                                  .map((contract) => (
                                    <SelectItem key={contract.id} value={contract.id}>
                                      {contract.title}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>Select a pending contract to issue.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-evenly">
                      <div>
                        <div className="mb-1 font-medium text-foreground text-sm">Event Type</div>
                        <div className="text-md">
                          <div className={` text-md`}>
                            {formatEnum(contractMap[form.watch('round.contractId')]?.contractType ?? ContractType.NONE)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 font-medium text-foreground text-sm">Per Share Price</div>
                        <div className="text-md">
                          <div className={` text-md`}>
                            {formatCurrency(
                              contractMap[form.watch('round.contractId')]?.warrantOptionsId
                                ? Number(contractMap[form.watch('round.contractId')]?.pricePerShare ?? 0)
                                : Number(businessInfo?.postMoneyValuation ?? 0) / Number(businessInfo?.totalShares ?? 0)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name={`round.shares`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Shares Issued (Max: {contractMap[form.watch('round.contractId')]?.shares ?? 0})
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              max={contractMap[form.watch('round.contractId')]?.shares ?? 0}
                            />
                          </FormControl>
                          <FormDescription>No. of shares issued in return.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <div className="mb-1 font-medium text-foreground text-sm">Current Valuation</div>
                      <div className="text-md">
                        <div className={`font-medium text-xl`}>
                          {formatCurrency(Number(businessInfo?.postMoneyValuation))}
                        </div>
                      </div>
                    </div>
                    <RoundMetrics
                      totalShares={Number(businessInfo?.totalShares ?? 0)}
                      balanceShares={
                        Number(businessInfo?.balanceShares ?? 0) -
                        Number(form.watch('round.shares') ?? 0) +
                        Number(form.watch('dilutions').reduce((acc, dilution) => acc + Number(dilution.shares), 0))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-md border-none overflow-hidden">
                <CardHeader className="z-10 relative flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>Dilutions</CardTitle>
                    <CardDescription>Add dilutions from current shareholders</CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      form.setValue('dilutions', [
                        ...form.getValues('dilutions'),
                        {
                          stakeholderId: '',
                          shares: 0,
                        },
                      ]);
                    }}
                    className="bg-pastel-lavender hover:bg-pastel-peach/90 text-foreground"
                  >
                    <Plus className="mr-1 w-4 h-4" /> Add Dilution
                  </Button>
                </CardHeader>
                <CardContent className="z-10 relative">
                  <div className="gap-8 grid">
                    {form.watch('dilutions').map((dilution, index) => (
                      <div key={`form-dilution-${index}`} className="space-y-4 bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-lg">Stakeholder {index + 1}</h3>
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              form.setValue(
                                'dilutions',
                                form.getValues('dilutions').filter((_, i) => i !== index)
                              );
                            }}
                            className="hover:bg-destructive/10 w-8 h-8 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="gap-4 grid grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`dilutions.${index}.stakeholderId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} {...field}>
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue
                                        placeholder={
                                          stakeholders.filter((x) => x.hasStakes).length > 0
                                            ? 'Select Stakeholder'
                                            : 'Stakeholders unavailable'
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {stakeholders
                                        .filter(
                                          (sh) =>
                                            !form
                                              .watch('dilutions')
                                              .filter((_, yIndex) => index !== yIndex)
                                              .map((dil) => dil.stakeholderId)
                                              .includes(sh.id)
                                        )
                                        .filter((sh) => sh.hasStakes)
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map((sh) => (
                                          <SelectItem key={sh.id} value={sh.id}>
                                            {formatEnum(sh.name)}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormDescription>Name of the Stakeholder.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`dilutions.${index}.shares`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shares</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>Amount of shares diluted.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" type="reset">
                Cancel
              </Button>
              <Button type="submit">Create Event</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RoundMetrics(props: { totalShares: number; balanceShares: number }) {
  return (
    <>
      <div>
        <div className="mb-1 font-medium text-foreground text-sm">Total Shares</div>
        <div className="text-md">
          <div className={`font-medium text-xl `}>{formatNumber(props.totalShares)}</div>
        </div>
      </div>
      <div>
        <div className="mb-1 font-medium text-foreground text-sm">Balance Shares</div>
        <div className="text-md">
          <div className={`font-medium text-xl ${props.balanceShares < 0 ? 'text-red-500' : ''}`}>
            {formatNumber(props.balanceShares)}
          </div>
        </div>
      </div>
    </>
  );
}
