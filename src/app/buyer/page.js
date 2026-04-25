'use client';
import dynamic from 'next/dynamic';
const BuyerPortal = dynamic(() => import('../BuyerPortal.jsx'), { ssr: false });
export default function BuyerPage() { return <BuyerPortal />; }
