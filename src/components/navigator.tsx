'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { useParams, usePathname } from 'next/navigation';

export default function Navigator() {
  const pathname = usePathname();
  const { businessId } = useParams();

  const pathList: { title: string; link: string }[] = [];

  const restPath = pathname.split('/').slice(3);

  restPath.forEach((path, index) => {
    if (index === 0) {
      if (path === 'dashboards')
        pathList.push({ title: 'Dashboards', link: `/business/${businessId}/dashboards/overview` });
      else if (path === 'events') pathList.push({ title: 'Events', link: `/business/${businessId}/events` });
      else if (path === 'stakeholders')
        pathList.push({ title: 'Stakeholders', link: `/business/${businessId}/stakeholders` });
      else if (path === 'magic') pathList.push({ title: 'Magic', link: `/business/${businessId}/magic/future` });
    } else if (index === 1) {
      if (restPath[0] === 'dashboards' && path === 'overview')
        pathList.push({ title: 'Overview', link: `/business/${businessId}/dashboards/overview` });
      else if (restPath[0] === 'events' && path === 'create')
        pathList.push({ title: 'Create', link: `/business/${businessId}/events/create` });
    }
  });
  return (
    <Breadcrumb className="">
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href={pathList[0].link}>{pathList[0].title}</BreadcrumbLink>
        </BreadcrumbItem>
        {pathList.length === 2 ? (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{pathList[1].title}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
