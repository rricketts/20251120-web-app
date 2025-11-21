import { CONFIG } from 'src/config-global';

import { ProfileView } from 'src/sections/profile/view';

export default function Page() {
  return (
    <>
      <title>{`Profile - ${CONFIG.appName}`}</title>
      <meta name="description" content="User profile page" />

      <ProfileView />
    </>
  );
}
