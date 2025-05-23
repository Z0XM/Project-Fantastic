'use client';

import { Dispatch, SetStateAction, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatDate, formatEnum, formatNumber } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useAppDispatch, useAppSelector } from '@/hooks/store';
import { setMultipleContext } from '@/lib/slices/aiContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { BusinessEvents, RoundType } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
  type: z.literal(RoundType.NEW_SHARES).or(z.literal(RoundType.STOCK_SPLIT)),
  name: z.string().min(1, { message: 'Round name is required' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  valuation: z.coerce.number().min(0, { message: 'Valuation is required' }),
  addedShares: z.coerce.number().positive().optional(),
  stockSplitRatio: z.coerce.number().positive().optional(),
});

export default function AllocateShares({
  isDialogOpen,
  setIsDialogOpen,
  backgroundColor,
}: {
  backgroundColor?: string;
  isDialogOpen: boolean;
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { businessId } = useParams();
  const dispatch = useAppDispatch();
  const businessInfoQuery = useQuery({
    queryKey: ['businessInfo', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/info`);
      const data = await response.json();

      return (data.businessInfo ?? null) as BusinessEvents | null;
    },
  });

  const queryClient = useQueryClient();

  const allocateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      await fetch(`/api/business/${businessId}/events/allocate-shares`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast.success('Shares allocated successfully!');
      queryClient.invalidateQueries({ queryKey: ['businessInfo', businessId] });
      queryClient.invalidateQueries({ queryKey: ['stakeholders', businessId] });
      queryClient.invalidateQueries({ queryKey: ['events', businessId] });
    },
    onError: () => {
      toast.error(`Error allocating shares!`);
    },
  });

  const businessInfo = businessInfoQuery.data;

  useEffect(() => {
    if (businessInfo) {
      form.setValue('valuation', Number(businessInfo.postMoneyValuation ?? 0));
      dispatch(
        setMultipleContext([
          {
            key: 'totalShares',
            contextString: `${Number(
              businessInfo?.totalShares ?? 0
            )} is the total no. of shares in the company before this round`,
            rawValue: Number(businessInfo?.totalShares ?? 0),
          },
          {
            key: 'balanceShares',
            contextString: `${Number(
              businessInfo?.balanceShares ?? 0
            )} is the total no. of balance shares in the company before this round`,
            rawValue: Number(businessInfo?.balanceShares ?? 0),
          },
          {
            key: 'currentValuation',
            contextString: `${Number(
              businessInfo?.postMoneyValuation ?? 0
            )} is the current valuation and post money valuation of the last round of the company`,
            rawValue: Number(businessInfo?.postMoneyValuation ?? 0),
          },
          {
            key: 'preMoneyValuation',
            contextString: `${Number(
              businessInfo?.preMoneyValuation ?? 0
            )} is the pre money valuation of the last round of the company`,
            rawValue: Number(businessInfo?.preMoneyValuation ?? 0),
          },
        ])
      );
    }
  }, [businessInfo]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    allocateMutation.mutate(values);
    setIsDialogOpen(false);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: RoundType.NEW_SHARES,
      date: formatDate(new Date()),
      valuation: Number(businessInfo?.postMoneyValuation ?? 0),
      addedShares: 0,
      stockSplitRatio: 1,
    },
  });

  useEffect(() => {
    form.watch((value, { name, type }) => {
      if (value.type === RoundType.NEW_SHARES) {
        dispatch(
          setMultipleContext([
            {
              key: 'typeOfEvent',
              contextString: `Type of round being raised is ${JSON.stringify(value.type)}`,
              rawValue: value.type,
            },
            {
              key: 'nameOfEvent',
              contextString: `Name of round being raised is is ${JSON.stringify(value.name)}`,
              rawValue: value.name,
            },
            {
              key: 'dateOfEvent',
              contextString: `Date of round being raised is ${JSON.stringify(value.date)}`,
              rawValue: value.date,
            },
            {
              key: 'valuationOfEvent',
              contextString: `Valuation after this round is ${JSON.stringify(value.valuation)}`,
              rawValue: value.valuation,
            },
            {
              key: 'addedShares',
              contextString: `Added shares in the round being raised are ${JSON.stringify(value.addedShares)}`,
              rawValue: value.addedShares,
            },
            {
              key: 'dilutionRatioAfterTheRound',
              contextString: `Dilution ratio after the round being raised will be ${JSON.stringify(
                Number(businessInfo?.totalShares ?? 0) /
                  (Number(businessInfo?.totalShares ?? 0) + Number(value.addedShares ?? 0))
              )}`,
              rawValue:
                Number(businessInfo?.totalShares ?? 0) /
                (Number(businessInfo?.totalShares ?? 0) + Number(value.addedShares ?? 0)),
            },
            {
              key: 'pricePerShareAfterTheRound',
              contextString: `Price per share after the round being raised will be ${JSON.stringify(
                Number(value.valuation) / (Number(businessInfo?.totalShares ?? 0) + Number(value.addedShares ?? 0))
              )}`,
              rawValue:
                Number(value.valuation) / (Number(businessInfo?.totalShares ?? 0) + Number(value.addedShares ?? 0)),
            },
            {
              key: 'totalSharesAfterTheRound',
              contextString: `Total shares after the round being raised will be ${JSON.stringify(
                Number(businessInfo?.totalShares ?? 0) + Number(value.addedShares ?? 0)
              )}`,
              rawValue: Number(businessInfo?.totalShares ?? 0) + Number(value.addedShares ?? 0),
            },
            {
              key: 'balanceSharesAfterTheRound',
              contextString: `Balance shares after the round being raised will be ${JSON.stringify(
                Number(businessInfo?.totalShares ?? 0) + Number(value.addedShares ?? 0)
              )}`,
              rawValue: Number(businessInfo?.totalShares ?? 0) + Number(value.addedShares ?? 0),
            },
          ])
        );
      } else {
        dispatch(
          setMultipleContext([
            {
              key: 'typeOfEvent',
              contextString: `Type of round being raised is ${JSON.stringify(value.type)}`,
              rawValue: value.type,
            },
            {
              key: 'nameOfEvent',
              contextString: `Name of round being raised is is ${JSON.stringify(value.name)}`,
              rawValue: value.name,
            },
            {
              key: 'dateOfEvent',
              contextString: `Date of round being raised is ${JSON.stringify(value.date)}`,
              rawValue: value.date,
            },
            {
              key: 'valuationOfEvent',
              contextString: `Valuation after this round is ${JSON.stringify(value.valuation)}`,
              rawValue: value.valuation,
            },
            {
              key: 'stockSplitRatio',
              contextString: `Stock split ratio in the round being raised are ${JSON.stringify(value.stockSplitRatio)}`,
              rawValue: value.stockSplitRatio,
            },
            {
              key: 'newSharesAfterTheRound',
              contextString: `New shares after the round being raised will be ${JSON.stringify(
                Number(businessInfo?.totalShares ?? 0) * Number(value.stockSplitRatio ?? 0)
              )}`,
              rawValue: Number(businessInfo?.totalShares ?? 0) * Number(value.stockSplitRatio ?? 0),
            },
            {
              key: 'totalSharesAfterTheRound',
              contextString: `Total shares after the round being raised will be ${JSON.stringify(
                Number(businessInfo?.totalShares ?? 0) * (1 + Number(value.stockSplitRatio ?? 0))
              )}`,
              rawValue: Number(businessInfo?.totalShares ?? 0) * (1 + Number(value.stockSplitRatio ?? 0)),
            },
            {
              key: 'balanceSharesAfterTheRound',
              contextString: `Balance shares after the round being raised will be ${JSON.stringify(
                Number(businessInfo?.balanceShares ?? 0) * (1 + Number(value.stockSplitRatio ?? 0))
              )}`,
              rawValue: Number(businessInfo?.balanceShares ?? 0) * (1 + Number(value.stockSplitRatio ?? 0)),
            },
          ])
        );
      }
    });
  }, [form.watch]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className={cn('bg-accent sm:max-w-[900px] max-h-[90vh] overflow-y-auto', backgroundColor)}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} onReset={() => setIsDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle className="text-foreground text-2xl">Allocate New Shares</DialogTitle>
              <DialogDescription>
                Enter the details of your new funding round. This will update your cap table with the new investor
                allocations.
              </DialogDescription>
            </DialogHeader>

            <div className="gap-8 grid my-4">
              <Card className="shadow-md border-none overflow-hidden">
                <CardHeader className="z-10 relative">
                  <CardTitle>Allocate New Shares Details</CardTitle>
                  <CardDescription>Enter the details of this round.</CardDescription>
                </CardHeader>
                <CardContent className="z-10 relative">
                  <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
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
                      name="date"
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
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Round Type</FormLabel>
                          <FormControl>
                            <Select defaultValue={RoundType.NEW_SHARES} onValueChange={field.onChange}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue {...field} />
                              </SelectTrigger>
                              <SelectContent>
                                {[RoundType.NEW_SHARES, RoundType.STOCK_SPLIT].map((key) => (
                                  <SelectItem key={key} value={RoundType[key as keyof typeof RoundType]}>
                                    {formatEnum(key)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>Type of Round</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valuation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Valuation</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>Valuation at which the round is raised.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch('type') === RoundType.NEW_SHARES ? (
                      <>
                        <FormField
                          control={form.control}
                          name="addedShares"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shares</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormDescription>Number of new shares.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div>
                          <div className="mb-1 font-medium text-foreground text-sm">Shares (Balance / Total) </div>
                          <div className="text-md">
                            {formatNumber(
                              Number(businessInfo?.balanceShares ?? 0) + Number(form.watch('addedShares') ?? 0)
                            )}{' '}
                            /{' '}
                            {formatNumber(
                              Number(businessInfo?.totalShares ?? 0) + Number(form.watch('addedShares') ?? 0)
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 font-medium text-foreground text-sm">Dilution Ratio</div>
                          <div className="text-md">
                            {formatNumber(
                              Number(businessInfo?.totalShares ?? 0) /
                                (Number(businessInfo?.totalShares ?? 0) + Number(form.watch('addedShares') ?? 0))
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 font-medium text-foreground text-sm">Price Per Share</div>
                          <div className="text-md">
                            {formatNumber(
                              Number(form.watch('valuation') ?? 0) /
                                (Number(businessInfo?.totalShares ?? 0) + Number(form.watch('addedShares') ?? 0))
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="stockSplitRatio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Split Ratio</FormLabel>
                              <FormControl>
                                <Select defaultValue={'0.5'} onValueChange={field.onChange}>
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue {...field} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['1/2', '1/4', '1/10'].map((key) => (
                                      <SelectItem
                                        key={key}
                                        value={(Number(key.split('/')[0]) / Number(key.split('/')[1])).toString()}
                                      >
                                        {key}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormDescription>Ratio to split stocks by.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div>
                          <div className="mb-1 font-medium text-foreground text-sm">New Shares</div>
                          <div className="text-md">
                            {formatNumber(
                              Number(businessInfo?.totalShares ?? 0) * Number(form.watch('stockSplitRatio') ?? 0)
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 font-medium text-foreground text-sm">Total Shares</div>
                          <div className="text-md">
                            {formatNumber(
                              Number(businessInfo?.totalShares ?? 0) * (1 + Number(form.watch('stockSplitRatio') ?? 0))
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 font-medium text-foreground text-sm">Balance Shares</div>
                          <div className="text-md">
                            {formatNumber(
                              Number(businessInfo?.balanceShares ?? 0) *
                                (1 + Number(form.watch('stockSplitRatio') ?? 0))
                            )}
                          </div>
                        </div>
                      </>
                    )}
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
