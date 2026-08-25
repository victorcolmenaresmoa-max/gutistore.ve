import { ReactNode } from 'react';

type IconName =
  | 'bag'
  | 'arrowRight'
  | 'shield'
  | 'truck'
  | 'message'
  | 'search'
  | 'chevronLeft'
  | 'package'
  | 'users'
  | 'dollar'
  | 'clock'
  | 'whatsapp'
  | 'logout'
  | 'store'
  | 'plus'
  | 'products'
  | 'orders'
  | 'trash'
  | 'edit'
  | 'check'
  | 'close'
  | 'lock'
  | 'menu'
  | 'sparkles'
  | 'phone'
  | 'mail'
  | 'location'
  | 'copy'
  | 'star'
  | 'heart'
  | 'award'
  | 'leaf'
  | 'zap'
  | 'flame'
  | 'target'
  | 'quote'
  | 'chevronRight'
  | 'chevronDown'
  | 'activity'
  | 'dumbbell'
  | 'droplet'
  | 'trending'
  | 'instagram'
  | 'facebook'
  | 'refresh'
  | 'calendar'
  | 'tag'
  | 'barChart'
  | 'layers'
  | 'gift';

const iconPaths: Record<IconName, ReactNode> = {
  bag: <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  truck: <><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /><path d="M8 9h8M8 13h5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  package: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  dollar: <><circle cx="12" cy="12" r="9" /><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8M12 6v12" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  whatsapp: <><path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" /><path d="M9.2 8.2c.4 2.8 2 4.4 4.8 4.9M14.2 13.1l1.2-1.2M9.2 8.2 8 9.4" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
  store: <><path d="M4 10v10h16V10" /><path d="M3 10h18l-2-6H5l-2 6Z" /><path d="M8 20v-6h8v6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  products: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  orders: <><path d="M6 3h12v18H6z" /><path d="M9 7h6M9 11h6M9 15h4" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" /><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 13l.8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3 9.5l6.1-.9L12 3Z" />,
  heart: <path d="M12 20s-7-4.4-9.4-8.5C1 8.5 2.4 5 6 5c2 0 3.2 1.2 4 2.4C10.8 6.2 12 5 14 5c3.6 0 5 3.5 3.4 6.5C19 15.6 12 20 12 20Z" />,
  award: <><circle cx="12" cy="9" r="6" /><path d="m8.5 13.5-1.5 7 5-3 5 3-1.5-7" /></>,
  leaf: <><path d="M4 20c0-9 6-15 16-15 0 10-6 16-16 15Z" /><path d="M4 20c4-6 8-9 12-11" /></>,
  zap: <path d="M13 3 4 14h7l-2 7 9-11h-7l2-7Z" />,
  flame: <path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.7-2.5C7 10 6 11.5 6 13.5a6 6 0 0 0 12 0C18 8.5 14 6 12 3Z" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
  quote: <><path d="M8 7c-2.2 0-4 1.8-4 4v6h6v-6H6c0-1.1.9-2 2-2V7Z" fill="currentColor" stroke="none" /><path d="M18 7c-2.2 0-4 1.8-4 4v6h6v-6h-4c0-1.1.9-2 2-2V7Z" fill="currentColor" stroke="none" /></>,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  activity: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  dumbbell: <><path d="M6.5 6.5v11M17.5 6.5v11M4 8v8M20 8v8M6.5 12h11" /></>,
  droplet: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
  trending: <><path d="M3 17 9 11l4 4 8-8" /><path d="M17 4h4v4" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></>,
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1Z" />,
  refresh: <><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2" /><path d="M20 4v5h-5M4 20v-5h5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  tag: <><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" /><circle cx="8" cy="8" r="1.6" /></>,
  barChart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5M3 17l9 5 9-5" /></>,
  gift: <><rect x="3" y="9" width="18" height="4" rx="1" /><path d="M5 13v8h14v-8M12 9v12" /><path d="M12 9C9 9 7 8 7 6a2 2 0 0 1 5-.5A2 2 0 0 1 17 6c0 2-2 3-5 3Z" /></>,
};

export default function Icon({
  name,
  size = 20,
  className = '',
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}
