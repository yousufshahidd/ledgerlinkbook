"use client";

import type React from 'react';
import { AccountingProvider } from './AccountingContext';

export const AppProviders: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <AccountingProvider>
      {children}
    </AccountingProvider>
  );
};
