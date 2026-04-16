'use client';
import dynamic from 'next/dynamic';
const ArtistPortal = dynamic(() => import('../ArtistPortal'), { ssr: false });
export default function ArtistPage() { return <ArtistPortal />; }
