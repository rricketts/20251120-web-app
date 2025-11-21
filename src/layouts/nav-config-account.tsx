import { Iconify } from 'src/components/iconify';

import type { AccountPopoverProps } from './components/account-popover';

// ----------------------------------------------------------------------

export const _account: AccountPopoverProps['data'] = [
  {
    label: 'Profile',
    href: '/profile',
    icon: <Iconify width={22} icon="solar:shield-keyhole-bold-duotone" />,
  },
  {
    label: 'Users',
    href: '/user',
    icon: <Iconify width={22} icon="solar:users-group-rounded-bold-duotone" />,
  },
  {
    label: 'Projects',
    href: '/user/projects',
    icon: <Iconify width={22} icon="solar:folder-bold-duotone" />,
  },
  {
    label: 'Integrations',
    href: '/integrations',
    icon: <Iconify width={22} icon="solar:link-circle-bold-duotone" />,
  },
];
