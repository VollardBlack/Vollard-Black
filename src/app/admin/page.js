'use client';
import dynamic from 'next/dynamic';
const VollardBlack = dynamic(() => import('./VollardBlack.jsx'), { ssr: false });
export default function AdminPage() { return <VollardBlack />; }
