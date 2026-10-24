import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  Ellipsis,
  House,
  MessageSquare,
  Moon,
  Plus,
  Send,
  Settings,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

/**
 * memex chrome icons — Pastel Sky uses Lucide, outlined. These adapters keep
 * the app's icon names so call sites stay stable; size and color come from
 * the surrounding CSS (currentColor), stroke from --icon-stroke-width.
 * Icons are decorative by default: the owning control carries the label.
 */

type IconProps = Omit<LucideProps, 'ref'>;

const adapt = (Icon: LucideIcon) => {
  const Adapted = (props: IconProps) => (
    <Icon aria-hidden="true" focusable="false" {...props} />
  );
  Adapted.displayName = `${Icon.displayName ?? 'Lucide'}Icon`;
  return Adapted;
};

export const HomeIcon = adapt(House);
export const ChatIcon = adapt(MessageSquare);
export const PlusIcon = adapt(Plus);
export const SendIcon = adapt(Send);
export const CloseIcon = adapt(X);
export const SoundOnIcon = adapt(Volume2);
export const SoundOffIcon = adapt(VolumeX);
export const SunIcon = adapt(Sun);
export const MoonIcon = adapt(Moon);
/** "More actions" on a row. */
export const MoreIcon = adapt(Ellipsis);
/** Settings/details for the thing you're standing in. */
export const GearIcon = adapt(Settings);
