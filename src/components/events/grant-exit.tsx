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
import { BusinessEvents, ContractType, RoundType, Stakeholders } from '@prisma/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

const formSchema = z.object({
  round: z.object({
    name: z.string().min(1, { message: 'Round name is required' }),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  }),
  exits: z.array(
    z.object({
      stakeholderId: z.string().min(1, { message: 'Investor  is required' }),
      notes: z.string().optional(),
    })
  ),
  issues: z.array(
    z.object({
      stakeholderId: z.string().min(1, { message: 'Dilution stakeholder is required' }),
      shares: z.coerce.number().min(0, { message: 'Dilution stakeholder shares are required' }),
    })
  ),
});

export default function GrantExit({
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
  const businessInfo = businessInfoQuery.data;

  const form = useForm<z.infer<typeof formSchema>>({
    // resolver: async (data, context, options) => {
    //   const result = await zodResolver(formSchema)(data, context, options);
    //   if (result.errors) {
    //     console.info('Form validation errors:', result.errors);
    //   }
    //   return result;
    // },
    resolver: zodResolver(formSchema),
    defaultValues: {
      round: {
        name: 'Exit Round',
        date: formatDate(new Date()),
      },
      exits: [
        {
          stakeholderId: '',
          notes: '',
        },
      ],
      issues: [],
    },
  });

  const queryClient = useQueryClient();

  const raiseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      await fetch(`/api/business/${businessId}/events/grant-exit`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast.success('Round Raised successfully!');
      queryClient.invalidateQueries({ queryKey: ['businessInfo', businessId] });
      queryClient.invalidateQueries({ queryKey: ['stakeholders', businessId] });
      queryClient.invalidateQueries({ queryKey: ['events', businessId] });
      queryClient.invalidateQueries({ queryKey: ['contracts', businessId] });
    },
    onError: (error) => {
      toast.error(`Error allocating shares!`);
    },
  });

  const stakeholdersMinQuery = useQuery({
    queryKey: ['stakeholders', businessId, 'min'],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/stakeholders/min`);
      const data = await response.json();
      return data as (Stakeholders & { name: string; ownershipShares: number; totalShares: number })[];
    },
  });

  const stakeholders = stakeholdersMinQuery.data ?? [];

  const stakeholderMap: { [key: string]: (typeof stakeholders)[0] } = {};
  stakeholders.forEach((stakeholder) => {
    stakeholderMap[stakeholder.id] = stakeholder;
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const balanceShares =
      Number(businessInfo?.balanceShares ?? 0) +
      values.exits.reduce((acc, exit) => acc + Number(stakeholderMap[exit.stakeholderId]?.totalShares ?? 0), 0) -
      values.issues.reduce((acc, issue) => acc + Number(issue.shares), 0);

    if (balanceShares !== 0) {
      toast.error('Non-zero Share Balance!');
      return;
    }

    raiseMutation.mutate(values);
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className={cn('bg-accent sm:max-w-[900px] max-h-[90vh] overflow-y-auto', backgroundColor)}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} onReset={() => setIsDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle className="text-foreground text-2xl">Grant Exit</DialogTitle>
              <DialogDescription>
                Enter the details of the exit round. This will update your cap table with the new investor allocations.
              </DialogDescription>
            </DialogHeader>

            <div className="gap-8 grid my-4">
              <Card className="shadow-md border-none overflow-hidden">
                <CardHeader className="z-10 relative">
                  <CardTitle>Exit Details</CardTitle>
                  <CardDescription>Enter the details of this exit round</CardDescription>
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
                            <Input placeholder="Exit Round" {...field} />
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

                    <RoundMetrics
                      oldValuation={Number(businessInfo?.postMoneyValuation ?? 0)}
                      totalShares={Number(businessInfo?.totalShares ?? 0)}
                      balanceShares={
                        Number(businessInfo?.balanceShares ?? 0) +
                        form
                          .watch('exits')
                          .reduce(
                            (acc, exit) => acc + Number(stakeholderMap[exit.stakeholderId]?.totalShares ?? 0),
                            0
                          ) -
                        form.watch('issues').reduce((acc, issue) => acc + Number(issue.shares), 0)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-md border-none overflow-hidden">
                <CardHeader className="z-10 relative flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>Exits</CardTitle>
                    <CardDescription>Add all exits in this round</CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      form.setValue('exits', [
                        ...form.getValues('exits'),
                        {
                          stakeholderId: '',
                          notes: '',
                        },
                      ]);
                    }}
                    className="bg-pastel-lavender hover:bg-pastel-peach/90 text-foreground"
                  >
                    <Plus className="mr-1 w-4 h-4" /> Add Exit
                  </Button>
                </CardHeader>
                <CardContent className="z-10 relative">
                  <div className="gap-8 grid">
                    {form.watch('exits').map((_, index) => (
                      <div key={`form-investement-${index}`} className="space-y-4 bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-lg">Stakeholder {index + 1}</h3>
                          {form.watch('exits').length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                form.setValue(
                                  'exits',
                                  form.getValues('exits').filter((_, i) => i !== index)
                                );
                              }}
                              className="hover:bg-destructive/10 w-8 h-8 text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="gap-4 grid grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`exits.${index}.stakeholderId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} {...field}>
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue
                                        placeholder={
                                          stakeholders.length > 0 ? 'Select Stakeholder' : 'Stakeholders unavailable'
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {stakeholders
                                        .filter(
                                          (sh) =>
                                            !form
                                              .watch('exits')
                                              .filter((_, yIndex) => index !== yIndex)
                                              .map((inv) => inv.stakeholderId)
                                              .includes(sh.id)
                                        )
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map((sh) => (
                                          <SelectItem key={sh.id} value={sh.id}>
                                            {formatEnum(sh.name)}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormDescription>Name of the Investor.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div>
                            <div className="mb-1 font-medium text-foreground text-sm">Exit Amount</div>
                            <div className="text-md">
                              <div className={`font-medium text-xl`}>
                                {formatCurrency(
                                  (Number(
                                    stakeholderMap[form.watch(`exits.${index}.stakeholderId`)]?.totalShares ?? 0
                                  ) *
                                    Number(businessInfo?.postMoneyValuation ?? 0)) /
                                    Number(businessInfo?.totalShares ?? 0)
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="mb-1 font-medium text-foreground text-sm">Exit Shares</div>
                            <div className="text-md">
                              <div className={`font-medium text-xl`}>
                                {formatNumber(
                                  Number(stakeholderMap[form.watch(`exits.${index}.stakeholderId`)]?.totalShares ?? 0)
                                )}
                              </div>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name={`exits.${index}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Input type="text" {...field} />
                                </FormControl>
                                <FormDescription>Add some info of the deal.</FormDescription>
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
              <Card className="shadow-md border-none overflow-hidden">
                <CardHeader className="z-10 relative flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>Issue Shares</CardTitle>
                    <CardDescription>Add shares issues to other stakeholders</CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      form.setValue('issues', [
                        ...form.getValues('issues'),
                        {
                          stakeholderId: '',
                          shares: 0,
                        },
                      ]);
                    }}
                    className="bg-pastel-lavender hover:bg-pastel-peach/90 text-foreground"
                  >
                    <Plus className="mr-1 w-4 h-4" /> Add Issue
                  </Button>
                </CardHeader>
                <CardContent className="z-10 relative">
                  <div className="gap-8 grid">
                    {form.watch('issues').map((issue, index) => (
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
                                'issues',
                                form.getValues('issues').filter((_, i) => i !== index)
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
                            name={`issues.${index}.stakeholderId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} {...field}>
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue
                                        placeholder={
                                          stakeholders.length > 0 ? 'Select Stakeholder' : 'Stakeholders unavailable'
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {stakeholders
                                        .filter(
                                          (sh) =>
                                            !form
                                              .watch('issues')
                                              .filter((sh, yIndex) => index !== yIndex)
                                              .map((dil) => dil.stakeholderId)
                                              .includes(sh.id) &&
                                            !form
                                              .watch('exits')
                                              .map((x) => x.stakeholderId)
                                              .includes(sh.id)
                                        )
                                        .filter((sh) => sh.ownershipShares > 0)
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
                            name={`issues.${index}.shares`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shares</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>Amount of shares issued.</FormDescription>
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

function RoundMetrics(props: { oldValuation: number; totalShares: number; balanceShares: number }) {
  return (
    <>
      <div>
        <div className="mb-1 font-medium text-foreground text-sm">Current Valuation</div>
        <div className="text-md">
          <div className={`font-medium text-xl'}`}>{formatCurrency(props.oldValuation)}</div>
        </div>
      </div>
      <div className="flex justify-evenly">
        <div>
          <div className="mb-1 font-medium text-foreground text-sm">Balance Shares</div>
          <div className="text-md">
            <div className={`font-medium text-xl ${props.balanceShares < 0 ? 'text-red-500' : ''}`}>
              {formatNumber(props.balanceShares)}
            </div>
          </div>
        </div>
        <div>
          <div className="mb-1 font-medium text-foreground text-sm">Total Shares</div>
          <div className="text-md">
            <div className={`font-medium text-xl `}>{formatNumber(props.totalShares)}</div>
          </div>
        </div>
      </div>
    </>
  );
}
