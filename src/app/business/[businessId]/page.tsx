'use client';

import Loading from '@/components/loading';
import { useAppDispatch } from '@/hooks/store';
import { Business } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { setBusiness } from '@/lib/slices/baseApp';

export default function BusinessPage() {
  const { businessId } = useParams();

  const dispatch = useAppDispatch();

  const businessQuery = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const res = await fetch(`/api/business/${businessId}`);

      const data = await res.json();

      dispatch(setBusiness(data));

      return data as Business;
    },
  });

  if (businessQuery.isLoading || !businessQuery.data) {
    return (
      <div className="flex justify-center items-center bg-accent w-full h-full">
        <Loading />
      </div>
    );
  }

  const business = businessQuery.data;

  return <div>Hello {business.name}</div>;
}
