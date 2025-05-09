"use client";

import React from 'react';
import { Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: number;
}

export function Spinner({ className, size = 24 }: SpinnerProps) {
  return (
    <Loader2 
      className={cn("animate-spin text-muted-foreground", className)} 
      size={size}
    />
  );
} 