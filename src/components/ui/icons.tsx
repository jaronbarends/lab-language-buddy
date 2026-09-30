/*
 * The app's icons, from Font Awesome 6 Free by way of react-icons.
 *
 * Attribution: Font Awesome Free 6, https://fontawesome.com — the icons are licensed
 * CC BY 4.0 (https://fontawesome.com/license/free); react-icons itself is MIT.
 *
 * Screens import these names rather than the Font Awesome components, so swapping the
 * set later is an edit to this file alone.
 *
 * Every icon here is decorative: in every usage it sits beside a text label, so it is
 * hidden from assistive tech and the label carries the meaning. react-icons fills with
 * currentColor, which is what lets a button's text colour reach the icon.
 */
import {
  FaCircleUser,
  FaComment,
  FaFlagCheckered,
  FaMicrophone,
  FaPencil,
  FaRegPaperPlane,
  FaRobot,
  FaXmark,
} from "react-icons/fa6";

type IconProps = {
  size?: number;
};

function decorative(size: number) {
  return { size, "aria-hidden": true, focusable: false } as const;
}

export function MicIcon({ size = 18 }: IconProps) {
  return <FaMicrophone {...decorative(size)} />;
}

export function SendIcon({ size = 18 }: IconProps) {
  return <FaRegPaperPlane {...decorative(size)} />;
}

export function PencilIcon({ size = 18 }: IconProps) {
  return <FaPencil {...decorative(size)} />;
}

export function CrossIcon({ size = 18 }: IconProps) {
  return <FaXmark {...decorative(size)} />;
}

export function FinishIcon({ size = 18 }: IconProps) {
  return <FaFlagCheckered {...decorative(size)} />;
}

export function ChatIcon({ size = 18 }: IconProps) {
  return <FaComment {...decorative(size)} />;
}

export function RobotIcon({ size = 18 }: IconProps) {
  return <FaRobot {...decorative(size)} />;
}

export function PersonIcon({ size = 18 }: IconProps) {
  return <FaCircleUser {...decorative(size)} />;
}
