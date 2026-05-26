import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  subtitle?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-600' },
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', text: 'text-green-600' },
  red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', text: 'text-red-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600', text: 'text-yellow-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
};

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('p-2.5 rounded-lg', colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className={cn('text-3xl font-bold mt-1', colors.text)}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
