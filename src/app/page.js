'use client';
import dynamic from 'next/dynamic';
const HubPage = dynamic(() => import('./HubPage.jsx'), { ssr: false });
export default function Page() { return <HubPage />; }
