'use client';
import dynamic from 'next/dynamic';

const RenterPortal = dynamic(() => import('../RenterPortal'), { ssr: false });

export default function RenterPage() {
  return <RenterPortal />;
}
