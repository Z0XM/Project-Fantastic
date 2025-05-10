'use client';

import { Dispatch, SetStateAction, useState } from 'react';
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
import { format } from 'date-fns';
import { cn, formatEnum } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { RoundType, Stakeholders } from '@prisma/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

const formSchema = z
  .object({
    round: z.object({
      name: z.string().min(1, { message: 'Round name is required' }),
      type: z.nativeEnum(RoundType),
      date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
      valuation: z.coerce.number().min(0, { message: 'Valuation is required' }),
    }),
    investments: z.array(
      z.object({
        stakeholder: z.object({
          name: z.string().min(1, { message: 'Investor name is required' }),
        }),
        contracts: z.array(z.object({ title: z.string(), description: z.string().optional(), rule: z.any() })),
        amount: z.coerce.number().min(0, { message: 'Amount is required' }),
        shares: z.coerce.number().min(0, { message: 'No. of shares is required' }),
        notes: z.string().optional(),
      })
    ),
    dilutions: z.array(
      z.object({
        name: z.string().min(1, { message: 'Dilution stakeholder name is required' }),
        shares: z.coerce.number().min(0, { message: 'Dilution stakeholder shares are required' }),
      })
    ),
  })
  .refine(
    (data) => {
      const totalInvestmentShares = data.investments.reduce((acc, investment) => acc + investment.shares, 0);
      const totalDilutionShares = data.dilutions.reduce((acc, dilution) => acc + dilution.shares, 0);
      return totalInvestmentShares === totalDilutionShares;
    },
    {
      message: 'Total shares allocated to investors must equal total shares diluted',
    }
  );

export default function CreateEventPopup({
  isDialogOpen,
  setIsDialogOpen,
  eventType,
  backgroundColor,
}: {
  backgroundColor?: string;
  isDialogOpen: boolean;
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
  eventType?: 'raise-round' | 'warrant-options' | 'allocate-shares' | 'issue-contracts';
}) {
  const { businessId } = useParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      round: {
        name: '',
        type: RoundType.SERIES_A,
        date: new Date().toISOString().split('T')[0],
        valuation: 0,
      },
      investments: [
        {
          stakeholder: { name: '' },
          contracts: [],
          amount: 0,
          shares: 0,
          notes: '',
        },
      ],
      dilutions: [
        {
          name: '',
          shares: 0,
        },
      ],
    },
  });

  const [sheetOpen, setSheetOpen] = useState(false);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // console.log('Form submitted', { investors, date });
    toast.success('Investment round saved successfully!');
    setIsDialogOpen(false);
  };

  const stakeholdersListQuery = useQuery({
    queryKey: ['stakeholders', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/stakeholders/min`);
      const data = await response.json();
      return data as (Stakeholders & { name: string; hasStakes: boolean })[];
    },
  });

  const stakeholders = stakeholdersListQuery.data ?? [];

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className={cn('bg-accent sm:max-w-[900px] max-h-[90vh] overflow-y-auto', backgroundColor)}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} onReset={() => setIsDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle className="text-foreground text-2xl">
                {eventType === 'raise-round'
                  ? 'Raise a Round'
                  : eventType === 'allocate-shares'
                  ? 'Allocate New Shares'
                  : eventType === 'issue-contracts'
                  ? 'Issue Existing Contracts'
                  : eventType === 'warrant-options'
                  ? 'Grant Warrants or Options'
                  : ''}
              </DialogTitle>
              <DialogDescription>
                Enter the details of your new funding round. This will update your cap table with the new investor
                allocations.
              </DialogDescription>
            </DialogHeader>

            <div className="gap-8 grid my-4">
              <Card className="shadow-md border-none overflow-hidden">
                <div className="z-0 absolute inset-0 bg-gradient-to-br from-pastel-blue via-white to-pastel-green opacity-30"></div>
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
                                  onSelect={(date) => date && field.onChange(format(new Date(date), 'yyyy-MM-dd'))}
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
                            <Select>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="..." {...field} />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(RoundType).map((key) => (
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
                      name="round.valuation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pre Money Valuation</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>Valuation at which the round is raised.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
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
                          amount: 0,
                          shares: 0,
                          notes: '',
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
                          {form.getValues('investments').length > 1 && (
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
                                  <Select {...field}>
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue
                                        placeholder={
                                          stakeholders.length > 0 ? 'Select Stakeholder' : 'Stakeholders unavailable'
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {stakeholders
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
                            name={`investments.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount Invested</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>Amount received from the investor.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`investments.${index}.shares`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shares Issued</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>No. of shares issued in return.</FormDescription>
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
                                        rule: '',
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
                                      form.getValues(`investments.${index}.contracts`).length - 1
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
                                      form.getValues(`investments.${index}.contracts`).length - 1
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
                                  <FormField
                                    control={form.control}
                                    name={`investments.${index}.contracts.${
                                      form.getValues(`investments.${index}.contracts`).length - 1
                                    }.rule`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Rules</FormLabel>
                                        <FormControl>
                                          <Textarea {...field} />
                                        </FormControl>
                                        <FormDescription>Rules of the contract.</FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex justify-end mt-4">
                                    <Button
                                      type="button"
                                      onClick={(e) => {
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

                          {form.watch(`investments.${index}.contracts`).length > 0 ? (
                            <Card>
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  {form.watch(`investments.${index}.contracts`).map((contract, cIndex) => (
                                    <div
                                      key={`contract-${index}-${cIndex}`}
                                      className="flex justify-between items-center bg-background p-2 rounded"
                                    >
                                      <div className="flex items-center">
                                        <File className="mr-2 w-4 h-4 text-muted-foreground" />
                                        <span>{contract.title}</span>
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
                          name: '',
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
                          {form.getValues('dilutions').length > 1 && (
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
                          )}
                        </div>

                        <div className="gap-4 grid grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`dilutions.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Select {...field}>
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
                                        .filter((user) => user.hasStakes)
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
