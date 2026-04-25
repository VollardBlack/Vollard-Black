'use client';
import dynamic from 'next/dynamic';
const RenterPortal = dynamic(() => import('../RenterPortal.jsx'), { ssr: false });
export default function RenterPage() { return <RenterPortal />; }
