'use client';

import { useEffect } from 'react';
import { captureSellerReferralFromUrl } from '@/lib/referral';

export default function SellerReferralTracker() {
  useEffect(() => {
    captureSellerReferralFromUrl();
  }, []);

  return null;
}
