import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ActionChipVariant = 'secondary' | 'primary' | 'accent';

interface ActionChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionChipVariant;
  /** Fixed-width chip metrics (6.75rem action chips: Settings, Select, Clear). */
  chip?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const ActionChip = ({
  variant = 'secondary',
  chip = true,
  icon,
  children,
  className,
  type,
  ...rest
}: ActionChipProps) => (
  <button
    type={type ?? 'button'}
    className={[
      'bookmark-toolbar-cta',
      `is-${variant}`,
      chip ? 'is-chip' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {icon && (
      <span className="bookmark-toolbar-cta-icon" aria-hidden="true">
        {icon}
      </span>
    )}
    <span>{children}</span>
  </button>
);

export default ActionChip;
