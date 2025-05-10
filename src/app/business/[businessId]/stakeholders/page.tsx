'use client';

import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { capTable } from '@/components/dashboard/data';
import { useAppSelector } from '@/hooks/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Stakeholders, StakeholderType, Users } from '@prisma/client';
import Loading from '@/components/loading';
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatEnum, formatNumber } from '@/lib/utils';

export default function StakeholdersPpage() {
  const { businessId } = useParams();
  const business = useAppSelector((state) => state.baseApp.business);

  const queryClient = useQueryClient();

  const stakeholdersQuery = useQuery({
    queryKey: ['stakeholders', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/business/${businessId}/stakeholders`);
      const data = await response.json();
      return data as (Stakeholders & {
        name: string;
        totalInvestment: number;
        totalShares: number;
        warrantNOptions: number;
      })[];
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

  const stakeholders = stakeholdersQuery.data;
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
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Ownership %</TableHead>
                <TableHead className="text-right">Join Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stakeholders.map((stakeholder) => (
                <TableRow
                  key={stakeholder.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => {}}
                >
                  <TableCell className="font-medium">{stakeholder.name}</TableCell>
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
                  <TableCell className="text-right">{formatNumber(stakeholder.totalShares)}</TableCell>
                  <TableCell className="text-right">{0}%</TableCell>
                  <TableCell className="text-right">{new Date(stakeholder.createdAt).toLocaleDateString()}</TableCell>
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
