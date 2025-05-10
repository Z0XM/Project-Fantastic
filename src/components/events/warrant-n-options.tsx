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
import { BusinessEvents, RoundType, Stakeholders } from '@prisma/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

const formSchema = z.object({
  round: z.object({
    name: z.string().min(1, { message: 'Round name is required' }),
    type: z.literal(RoundType.WARRANT).or(z.literal(RoundType.OPTION)),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  }),
  investments: z.array(
    z.object({
      stakeholder: z.object({
        name: z.string().min(1, { message: 'Investor name is required' }),
      }),
      contracts: z
        .array(
          z.object({
            title: z.string(),
            description: z.string().optional(),
          })
        )
        .min(1, { message: 'At least one contract is required' }),
      pricePerShare: z.coerce.number().min(0, { message: 'Per share price is required' }),
      shares: z.coerce.number().min(1, { message: 'No. of shares is required' }),
      notes: z.string().optional(),
    })
  ),
});

export default function WarrantNOptions({
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

    //   return result;
    // },
    resolver: zodResolver(formSchema),
    defaultValues: {
      round: {
        name: '',
        type: RoundType.WARRANT,
        date: formatDate(new Date()),
      },
      investments: [
        {
          stakeholder: { name: '' },
          contracts: [],
          shares: 0,
          notes: '',
          pricePerShare: 0,
        },
      ],
    },
  });

  const [sheetOpen, setSheetOpen] = useState(false);

  const queryClient = useQueryClient();

  const raiseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      await fetch(`/api/business/${businessId}/events/warrant-n-options`, {
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    raiseMutation.mutate(values);
    setIsDialogOpen(false);
    form.reset();
  };

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
              <DialogTitle className="text-foreground text-2xl">Raise a Round</DialogTitle>
              <DialogDescription>
                Enter the details of your new funding round. This will update your cap table with the new investor
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
                      name="round.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Round Type</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} {...field}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="..." {...field} />
                              </SelectTrigger>
                              <SelectContent>
                                {[RoundType.WARRANT, RoundType.OPTION].sort().map((key) => (
                                  <SelectItem key={key} value={RoundType[key as keyof typeof RoundType]}>
                                    {formatEnum(key)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>Issue Warrants or Options</FormDescription>
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
                      balanceShares={Number(businessInfo?.balanceShares ?? 0)}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-md border-none overflow-hidden">
                <CardHeader className="z-10 relative flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>Investors</CardTitle>
                    <CardDescription>Add all investors participating in this round</CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      form.setValue('investments', [
                        ...form.getValues('investments'),
                        {
                          stakeholder: { name: '' },
                          contracts: [],
                          shares: 0,
                          notes: '',
                          pricePerShare: 0,
                        },
                      ]);
                    }}
                    className="bg-pastel-lavender hover:bg-pastel-peach/90 text-foreground"
                  >
                    <Plus className="mr-1 w-4 h-4" /> Add Investment
                  </Button>
                </CardHeader>
                <CardContent className="z-10 relative">
                  <div className="gap-8 grid">
                    {form.watch('investments').map((investment, index) => (
                      <div key={`form-investement-${index}`} className="space-y-4 bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-lg">Investor {index + 1}</h3>
                          {form.watch('investments').length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                form.setValue(
                                  'investments',
                                  form.getValues('investments').filter((_, i) => i !== index)
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
                            name={`investments.${index}.stakeholder.name`}
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
                                          (user) =>
                                            !form
                                              .watch('investments')
                                              .filter((_, yIndex) => index !== yIndex)
                                              .map((inv) => inv.stakeholder.name)
                                              .includes(user.name)
                                        )
                                        .map((user) => user.name)
                                        .sort()
                                        .map((type) => (
                                          <SelectItem key={type} value={type}>
                                            {formatEnum(type)}
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
                          <FormField
                            control={form.control}
                            name={`investments.${index}.pricePerShare`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Per Share Price</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>Price at which shares must be issued.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`investments.${index}.shares`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shares Promised</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>No. of shares promised in contract.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`investments.${index}.notes`}
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

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Contracts & Documents</Label>
                            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                              <SheetTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="button"
                                  onClick={(e) => {
                                    // e.preventDefault();
                                    form.setValue(
                                      `investments.${index}.contracts`,
                                      form.getValues(`investments.${index}.contracts`).concat({
                                        title: '',
                                        description: '',
                                      })
                                    );
                                  }}
                                >
                                  <FilePlus className="mr-1 w-4 h-4" /> Add Contract
                                </Button>
                              </SheetTrigger>
                              <SheetContent>
                                <SheetHeader>
                                  <SheetTitle>Add Contract</SheetTitle>
                                  <SheetDescription>Set a contract between the entities.</SheetDescription>
                                </SheetHeader>
                                <div className="space-y-4 mx-4 mt-6">
                                  <FormField
                                    control={form.control}
                                    name={`investments.${index}.contracts.${
                                      form.watch(`investments.${index}.contracts`).length - 1
                                    }.title`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                          <Input type="text" {...field} />
                                        </FormControl>
                                        <FormDescription>Title of the contract.</FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`investments.${index}.contracts.${
                                      form.watch(`investments.${index}.contracts`).length - 1
                                    }.description`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <Textarea {...field} />
                                        </FormControl>
                                        <FormDescription>Details of the contract.</FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="flex justify-end mt-4">
                                    <Button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSheetOpen(false);
                                      }}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              </SheetContent>
                            </Sheet>
                          </div>
                          <div className="py-2">
                            <FormField name={`investments.${index}.contracts`} render={() => <FormMessage />} />
                          </div>
                          {form.watch(`investments.${index}.contracts`).length > 0 ? (
                            <Card>
                              <CardContent className="px-3">
                                <div className="">
                                  {form.watch(`investments.${index}.contracts`).map((contract, cIndex) => (
                                    <div
                                      key={`contract-${index}-${cIndex}`}
                                      className="flex justify-between items-center bg-background p-2 rounded"
                                    >
                                      <div className="flex items-center">
                                        <File className="mr-2 w-4 h-4 text-muted-foreground" />
                                        {contract.title ? (
                                          <span>{contract.title}</span>
                                        ) : (
                                          <span>Contract {cIndex + 1}</span>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          form.setValue(
                                            `investments.${index}.contracts`,
                                            form
                                              .getValues(`investments.${index}.contracts`)
                                              .filter((_, i) => i !== cIndex)
                                          );
                                        }}
                                        className="w-6 h-6 text-muted-foreground hover:text-destructive"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="p-4 border border-dashed rounded-md text-muted-foreground text-sm text-center">
                              No contracts added yet
                            </div>
                          )}
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
