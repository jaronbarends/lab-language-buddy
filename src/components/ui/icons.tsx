/**
 * Inline SVGs rather than an icon package: nine glyphs don't justify a dependency,
 * and inlining keeps them tintable with `currentColor`.
 *
 * All are decorative — they sit next to a text label in every usage — so they're
 * hidden from assistive tech and the label carries the meaning.
 */
type IconProps = {
  size?: number;
};

function iconAttributes(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };
}

export function MicIcon({ size = 18 }: IconProps) {
  return (
    <svg {...iconAttributes(size)}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
    </svg>
  );
}

export function StopIcon({ size = 18 }: IconProps) {
  return (
    <svg {...iconAttributes(size)}>
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}

export function SendIcon({ size = 18 }: IconProps) {
  return (
    <svg {...iconAttributes(size)}>
      <path d="M4 12 20 4l-4 16-4-6-8-2Z" />
    </svg>
  );
}

export function PencilIcon({ size = 18 }: IconProps) {
  return (
    <svg {...iconAttributes(size)}>
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="m14 6 4 4" />
    </svg>
  );
}

export function CrossIcon({ size = 18 }: IconProps) {
  return (
    <svg {...iconAttributes(size)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function FinishIcon({ size = 18 }: IconProps) {
  return (
    <svg {...iconAttributes(size)}>
      <path d="M5 21V4" />
      <path d="M5 4h13l-2.5 4L18 12H5" />
    </svg>
  );
}

export function ChatIcon({ size = 18 }: IconProps) {
  return (
    <svg {...iconAttributes(size)}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 0 1 8-8h2a8 8 0 0 1 8 4Z" />
    </svg>
  );
}

export function RobotIcon({ size = 18 }: IconProps) {
  return (
    <svg {...iconAttributes(size)}>
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 4v4" />
      <circle cx="9" cy="13.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PersonIcon({ size = 18 }: IconProps) {
  return (
    <svg {...iconAttributes(size)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
