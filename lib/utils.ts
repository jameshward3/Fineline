import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInches(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(2)}"`;
}

export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

export function mmToInches(mm: number): number {
  return mm / 25.4;
}

export function formatRelativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
