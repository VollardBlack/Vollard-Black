'use client';
import dynamic from 'next/dynamic';
const ArtistPortal = dynamic(() => import('../ArtistPortal.jsx'), { ssr: false });
export default function ArtistPage() { return <ArtistPortal />; }
