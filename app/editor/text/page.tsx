'use client';
import dynamic from 'next/dynamic';

const TextEditor = dynamic(
  () => import('@/components/tinyMCE'),
  { ssr: false }
);

export default function Page() {
  return <TextEditor />;
}
