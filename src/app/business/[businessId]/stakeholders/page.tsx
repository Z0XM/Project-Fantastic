'use client';

import { Button } from '@/components/ui/button';
import { Coins, DollarSign, UserPlus } from 'lucide-react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/hooks/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { BusinessEvents, Stakeholders, StakeholderType, Users } from '@prisma/client';
import Loading from '@/components/loading';
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatEnum, formatNumber } from '@/lib/utils';
import { setMultipleContext } from '@/lib/slices/aiContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

export default function StakeholdersPpage() {
  const { businessId } = useParams();
  const business = useAppSelector((state) => state.baseApp.business);

  const dispatch = useAppDispatch();

  const businessInfoQuery = useQuery({
    queryKey: ['businessInfo', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/info`);
      const data = await response.json();
      return (data.businessInfo ?? null) as BusinessEvents | null;
    },
  });
  const businessInfo = businessInfoQuery.data;

  const queryClient = useQueryClient();

  const stakeholdersQuery = useQuery({
    queryKey: ['stakeholders', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/stakeholders`);
      const data = await response.json();

      dispatch(
        setMultipleContext([
          {
            key: 'stakeholders',
            contextString: `This is a list of all stakeholders in the company ${JSON.stringify(data.stakeholders)}`,
            rawValue: data.stakeholders,
          },
          {
            key: 'totalOwnershipShares',
            contextString: `${data.totalOwnershipShares} is the total no. of shares with the stakeholders which grant ownership in the company`,
            rawValue: data.totalOwnershipShares,
          },
          {
            key: 'totalOwnedShares',
            contextString: `${data.totalOwnedShares} is the total no. of shares with stakeholders`,
            rawValue: data.totalOwnedShares,
          },
          {
            key: 'totalShares',
            contextString: `${Number(businessInfo?.totalShares ?? 0)} is the total no. of shares in the company`,
            rawValue: Number(businessInfo?.totalShares ?? 0),
          },
          {
            key: 'balanceShares',
            contextString: `${Number(
              businessInfo?.balanceShares ?? 0
            )} is the total no. of balance shares in the company`,
            rawValue: Number(businessInfo?.balanceShares ?? 0),
          },
          {
            key: 'currentValuation',
            contextString: `${Number(businessInfo?.postMoneyValuation ?? 0)} is the current valuation of the company`,
            rawValue: Number(businessInfo?.postMoneyValuation ?? 0),
          },
          {
            key: 'totalInvestment',
            contextString: `${data.totalInvestment} is the total amount invested by the stakeholders in the company`,
            rawValue: data.totalInvestment,
          },
        ])
      );

      return data as {
        totalOwnershipShares: number;
        totalOwnedShares: number;
        totalInvestment: number;
        stakeholders: (Stakeholders & {
          name: string;
          totalInvestment: number;
          ownedShares: number;
          ownershipShares: number;
          promisedShares: number;
          stockValue: number;
        })[];
      };
    },
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch(`/api/users`);
      const data = await response.json();
      return data as Users[];
    },
  });

  const stakeHolderMutation = useMutation({
    mutationFn: async (stakeholder: { name: string; type: string; config?: any }) => {
      await fetch(`/api/business/${businessId}/stakeholders`, {
        method: 'POST',
        body: JSON.stringify(stakeholder),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast.success(`Added stakeholder!`);
      queryClient.invalidateQueries({ queryKey: ['stakeholders', businessId] });
    },
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({
    name: '',
    type: '',
  });

  const handleAddStakeholder = () => {
    if (!newStakeholder.name.trim()) {
      toast.error('Please enter a stakeholder name');
      return;
    }

    stakeHolderMutation.mutate({ ...newStakeholder });

    setOpenDialog(false);
    setNewStakeholder({ name: '', type: '' });
  };

  if (stakeholdersQuery.isLoading || !stakeholdersQuery.data) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <Loading />
      </div>
    );
  }

  const stakeholders = stakeholdersQuery.data.stakeholders ?? [];
  const totalOwnershipShares = stakeholdersQuery.data.totalOwnershipShares ?? 0;
  const totalOwnedShares = stakeholdersQuery.data.totalOwnedShares ?? 0;
  const totalInvestment = stakeholdersQuery.data.totalInvestment ?? 0;
  const users = usersQuery.data ?? [];

  return (
    <div className="mx-auto p-4 md:p-6 container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-3xl">Stakeholders</h1>
        <Button
          onClick={() => {
            setOpenDialog(true);
          }}
        >
          <UserPlus className="mr-2 w-4 h-4" /> Add Stakeholder
        </Button>
      </div>
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3 mb-6">
        <Card className="bg-pastel-green">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center font-medium text-sm">
              <DollarSign className="mr-2 w-4 h-4" />
              Current Valuation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{formatCurrency(Number(businessInfo?.postMoneyValuation ?? 0))}</div>
            <p className="mt-1 text-muted-foreground text-xs">Company&apos;s estimated worth</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-purple">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center font-medium text-sm">
              <Coins className="mr-2 w-4 h-4" />
              Issued Shares / Total Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatNumber(Number(totalOwnedShares))} / {formatNumber(Number(businessInfo?.totalShares))}
            </div>
            <p className="mt-1 text-muted-foreground text-xs">Issued business shares</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-rose">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center font-medium text-sm">
              <DollarSign className="mr-2 w-4 h-4" />
              Total Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{formatCurrency(totalInvestment)}</div>
            <p className="mt-1 text-muted-foreground text-xs">Capital raised from investors</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg">Heroes of your Business</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of all stakeholders in {business?.name}</TableCaption>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total Investment</TableHead>
                <TableHead className="text-right">Total Shares</TableHead>
                <TableHead className="text-right">Equity %</TableHead>
                <TableHead className="text-right">Ownership %</TableHead>
                <TableHead className="text-right">Promised Shares</TableHead>
                <TableHead className="text-right">Current Stock Value</TableHead>
                {/* <TableHead className="text-right">Join Date</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {stakeholders.map((stakeholder) => (
                <TableRow
                  key={stakeholder.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => {}}
                >
                  <TableCell className="flex justify-between gap-2 font-medium">
                    {stakeholder.name}
                    {stakeholder.hasExited && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="bg-destructive/10 border-destructive/20 text-destructive"
                              onClick={(e) => {
                                // Prevent row click event from firing
                                e.stopPropagation();
                              }}
                            >
                              Exited
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-semibold">Exit Details</p>
                              <p className="text-xs">
                                Amount: {formatCurrency(Number(stakeholder.exitedAtPrice ?? 0))}
                              </p>
                              <p className="text-xs">
                                {Number(stakeholder.exitedAtPrice ?? 0) > Number(stakeholder.totalInvestment) ? (
                                  <>
                                    <span>Profit: </span>{' '}
                                    <span>
                                      {((Number(stakeholder.exitedAtPrice ?? 0) - Number(stakeholder.totalInvestment)) *
                                        100) /
                                        Number(stakeholder.totalInvestment)}{' '}
                                      %
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span>Loss: </span>{' '}
                                    <span>
                                      {((Number(stakeholder.totalInvestment) - Number(stakeholder.exitedAtPrice ?? 0)) *
                                        100) /
                                        Number(stakeholder.totalInvestment)}{' '}
                                      %
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${stakeholder.type === StakeholderType.FOUNDING_TEAM ? 'bg-pastel-blue text-foreground' : ''}
                      ${stakeholder.type === StakeholderType.ANGEL_INVESTOR ? 'bg-pastel-green text-foreground' : ''}
                      ${stakeholder.type === StakeholderType.FRIENDS_N_FAMILY ? 'bg-pastel-purple text-foreground' : ''}
                      ${stakeholder.type === StakeholderType.OTHER ? 'bg-pastel-gray text-foreground' : ''}
                    `}
                    >
                      {stakeholder.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(stakeholder.totalInvestment)}</TableCell>
                  <TableCell className="text-right">{formatNumber(stakeholder.ownedShares)}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber((stakeholder.ownedShares / totalOwnedShares) * 100)} %
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber((stakeholder.ownershipShares / totalOwnershipShares) * 100)}%
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(stakeholder.promisedShares)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(stakeholder.stockValue)}</TableCell>
                  {/* <TableCell className="text-right">{new Date(stakeholder.createdAt).toLocaleDateString()}</TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Stakeholder</DialogTitle>
          </DialogHeader>
          <div className="gap-4 grid py-4">
            <div className="items-center gap-4 grid grid-cols-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Select
                value={newStakeholder.name}
                onValueChange={(value) => setNewStakeholder({ ...newStakeholder, name: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .map((user) => user.name)
                    .filter((user) => !stakeholders.map((x) => x.name).includes(user))
                    .sort()
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
                          return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
                        })}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="items-center gap-4 grid grid-cols-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={newStakeholder.type}
                onValueChange={(value) => setNewStakeholder({ ...newStakeholder, type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select stakeholder type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(StakeholderType)
                    .sort()
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatEnum(type)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddStakeholder}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
