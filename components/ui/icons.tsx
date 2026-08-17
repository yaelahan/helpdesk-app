import type { SVGProps } from "react";

/**
 * Hand-built icon set. Six glyphs did not justify an icon dependency, and
 * drawing them here keeps them on the same 1.5px hairline weight as the rest
 * of the Cobalt surface treatment.
 *
 * All use currentColor and are aria-hidden -- they sit beside real text
 * labels, so announcing them would just duplicate the label.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="size-[18px] shrink-0"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </Icon>
  );
}

export function QueueIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 7.5h18" />
      <path d="M3 12h18" />
      <path d="M3 16.5h12" />
    </Icon>
  );
}

export function NewTicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M12 8.5v7" />
      <path d="M8.5 12h7" />
    </Icon>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 4.5H6.5A2 2 0 0 0 4.5 6.5v11a2 2 0 0 0 2 2H15" />
      <path d="M15.5 12H21" />
      <path d="M18.5 9 21 12l-2.5 3" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </Icon>
  );
}
