import type { HTMLAttributes } from 'react';

/**
 * The frosted-glass container every module list lives in
 * (translucent bubble fill, blur, hairline border, 10px radius).
 */
const FrostedStack = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={['bookmark-feed-stack', className ?? ''].filter(Boolean).join(' ')}
    {...rest}
  >
    {children}
  </div>
);

export default FrostedStack;
