import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

const EmptyState = ({ title, subtitle, children }: EmptyStateProps) => (
  <div className="bookmark-list-empty">
    <p className="bookmark-list-empty-title">{title}</p>
    {subtitle && <p className="bookmark-list-empty-subtitle">{subtitle}</p>}
    {children}
  </div>
);

export default EmptyState;
