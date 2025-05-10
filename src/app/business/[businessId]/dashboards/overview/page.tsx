'use client';

import { useAppSelector } from '@/hooks/store';
import Overview from '@/components/dashboard/overview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DetailView from '@/components/dashboard/detailView';
import ShareholderChart from '@/components/dashboard/shareholderChart';
import RoundHistory from '@/components/dashboard/roundHistory';

export default function BusinessPage() {
  const business = useAppSelector((state) => state.baseApp.business);

  return (
    <div className="bg-gray-50">
      {/* <Navbar /> */}

      <main className="mx-auto px-4 py-6 container">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-bold text-2xl">{business?.name ?? ''}</h1>
            <p className="text-muted-foreground text-sm">Cap Table Dashboard</p>
          </div>
          <div className="text-sm text-right">
            <div className="font-medium">Last Updated</div>
            <div className="text-muted-foreground">
              {business
                ? new Date(business.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : ''}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview Cards */}
          <Overview />

          {/* Charts */}
          <div className="space-y-6">
            <ShareholderChart />
            <RoundHistory />
          </div>

          {/* Detail Tabs */}
          <Tabs defaultValue="shareholders">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-xl">Details</h2>
              <TabsList>
                <TabsTrigger value="shareholders">Shareholders</TabsTrigger>
                <TabsTrigger value="rounds">Funding Rounds</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="shareholders">
              <DetailView activeTab="shareholders" />
            </TabsContent>

            <TabsContent value="rounds">
              <DetailView activeTab="rounds" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
