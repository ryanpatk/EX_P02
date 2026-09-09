import type { SVGProps } from 'react';

/**
 * memex chrome icons — "Filled Friendly" (JOYFUL_SYSTEMS): solid rounded
 * silhouettes in currentColor on a 16px grid. Cutouts are real holes
 * (evenodd subpaths), so a glyph reads correctly on any surface — canvas,
 * primary fill, or frosted glass — without knowing the color behind it.
 *
 * Chrome only. Content surfaces (cards) keep their quieter outline glyphs.
 */

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

const Base = ({ children, ...rest }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    stroke="none"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

/** Rounded house with a round-topped door. */
export const HomeIcon = (props: IconProps) => (
  <Base {...props}>
    <path
      fillRule="evenodd"
      d="M7.3 2.55a1 1 0 0 1 1.4 0l4.8 4.4c.3.28.5.68.5 1.1V12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12V8.05c0-.42.2-.82.5-1.1l4.8-4.4ZM7.6 8.75a1.1 1.1 0 0 0-1.1 1.1V13.5h3V9.85a1.1 1.1 0 0 0-1.1-1.1h-.8Z"
    />
  </Base>
);

/** Simple chat message bubble with two text lines. */
export const ChatIcon = (props: IconProps) => (
  <Base {...props}>
    <path
      fillRule="evenodd"
      d="M8 2.5c3.3 0 5.75 1.95 5.75 4.4S11.3 11.3 8 11.3c-.5 0-1-.04-1.45-.13L3.4 13.3c-.5.3-1.1-.15-.95-.7l.6-2.2C2.4 9.65 2.25 8.8 2.25 6.9 2.25 4.45 4.7 2.5 8 2.5ZM5.9 5.9a.65.65 0 0 0 0 1.3h4.2a.65.65 0 0 0 0-1.3H5.9Zm0 2.2a.65.65 0 0 0 0 1.3h2.2a.65.65 0 0 0 0-1.3H5.9Z"
    />
  </Base>
);

export const PlusIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="6.75" y="2.75" width="2.5" height="10.5" rx="1.25" />
    <rect x="2.75" y="6.75" width="10.5" height="2.5" rx="1.25" />
  </Base>
);

/** Paper plane. */
export const SendIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.75 6.6 12.6 2.55c.9-.37 1.8.53 1.43 1.43L9.98 13.83c-.4.97-1.8.9-2.1-.1L6.9 10.5a1 1 0 0 0-.65-.65L3 8.85c-1-.3-1.07-1.7-.1-2.1L2.75 6.6Z" />
  </Base>
);

export const CloseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4.1 4.1a1.1 1.1 0 0 1 1.55 0L8 6.45l2.35-2.35a1.1 1.1 0 1 1 1.55 1.55L9.55 8l2.35 2.35a1.1 1.1 0 1 1-1.55 1.55L8 9.55l-2.35 2.35a1.1 1.1 0 1 1-1.55-1.55L6.45 8 4.1 5.65a1.1 1.1 0 0 1 0-1.55Z" />
  </Base>
);

/** Chunky check mark (used inside the task checkbox). */
export const CheckIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M5.1 8.3a.95.95 0 0 1 1.35-1.3l1.05 1.1 2.7-3.1a.95.95 0 1 1 1.45 1.2L8.2 10.5a.95.95 0 0 1-1.4.05L5.1 8.3Z" />
  </Base>
);

export const SoundOnIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3 6.25c0-.55.45-1 1-1h1.55L8.4 3.1c.66-.5 1.6-.03 1.6.8v8.2c0 .83-.94 1.3-1.6.8L5.55 10.75H4a1 1 0 0 1-1-1v-3.5Z" />
    <path d="M11.2 5.7a.9.9 0 0 1 1.27.1 3.4 3.4 0 0 1 0 4.4.9.9 0 0 1-1.37-1.16 1.6 1.6 0 0 0 0-2.08.9.9 0 0 1 .1-1.26Z" />
  </Base>
);

export const SoundOffIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M3 6.25c0-.55.45-1 1-1h1.55L8.4 3.1c.66-.5 1.6-.03 1.6.8v8.2c0 .83-.94 1.3-1.6.8L5.55 10.75H4a1 1 0 0 1-1-1v-3.5Z" />
    <path d="M10.9 6.15a.85.85 0 0 1 1.2 0l.9.9.9-.9a.85.85 0 1 1 1.2 1.2l-.9.9.9.9a.85.85 0 1 1-1.2 1.2l-.9-.9-.9.9a.85.85 0 1 1-1.2-1.2l.9-.9-.9-.9a.85.85 0 0 1 0-1.2Z" />
  </Base>
);

export const SunIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5a.9.9 0 0 1 .9.9v1a.9.9 0 1 1-1.8 0v-1a.9.9 0 0 1 .9-.9Zm0 10.2a.9.9 0 0 1 .9.9v1a.9.9 0 1 1-1.8 0v-1a.9.9 0 0 1 .9-.9ZM1.5 8a.9.9 0 0 1 .9-.9h1a.9.9 0 1 1 0 1.8h-1A.9.9 0 0 1 1.5 8Zm10.2 0a.9.9 0 0 1 .9-.9h1a.9.9 0 1 1 0 1.8h-1a.9.9 0 0 1-.9-.9ZM3.4 3.4a.9.9 0 0 1 1.27 0l.7.7A.9.9 0 1 1 4.1 5.37l-.7-.7a.9.9 0 0 1 0-1.27Zm7.23 7.23a.9.9 0 0 1 1.27 0l.7.7a.9.9 0 1 1-1.27 1.27l-.7-.7a.9.9 0 0 1 0-1.27ZM12.6 3.4a.9.9 0 0 1 0 1.27l-.7.7a.9.9 0 1 1-1.27-1.27l.7-.7a.9.9 0 0 1 1.27 0ZM5.37 10.63a.9.9 0 0 1 0 1.27l-.7.7A.9.9 0 1 1 3.4 11.33l.7-.7a.9.9 0 0 1 1.27 0Z" />
  </Base>
);

export const MoonIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M9.2 2.2a.75.75 0 0 1 .3 1.1A4.6 4.6 0 0 0 12.7 10a.75.75 0 0 1 .85.9A5.9 5.9 0 1 1 8.4 2.05a.75.75 0 0 1 .8.15Z" />
  </Base>
);

/** Three dots — "more actions" on a row. */
export const MoreIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="3.5" cy="8" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="12.5" cy="8" r="1.5" />
  </Base>
);

/** Gear — settings/details for the thing you're standing in. Built from a
 * ring (evenodd hole) and eight rotated rounded teeth so it renders the
 * same in every engine. */
export const GearIcon = (props: IconProps) => (
  <Base {...props}>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <rect
        key={deg}
        x="6.7"
        y="1.1"
        width="2.6"
        height="3.4"
        rx="1.1"
        transform={`rotate(${deg} 8 8)`}
      />
    ))}
    <path
      fillRule="evenodd"
      d="M8 3.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 1 0 0-9.4Zm0 2.55a2.15 2.15 0 1 1 0 4.3 2.15 2.15 0 1 1 0-4.3Z"
    />
  </Base>
);
