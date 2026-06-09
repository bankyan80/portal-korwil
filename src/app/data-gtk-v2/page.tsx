'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DataGtkV2Page() {
  const router = useRouter();
  useEffect(() => { router.replace('/simpeg'); }, [router]);
  return null;
}
