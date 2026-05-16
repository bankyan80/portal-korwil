'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SPMBPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/spmb-sd');
  }, [router]);

  return null;
}
