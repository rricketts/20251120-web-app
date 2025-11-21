import { CONFIG } from 'src/config-global';

import { BacklinksView } from 'src/sections/backlinks/view';

export default function Page() {
  return (
    <>
      <title>{`Backlinks - ${CONFIG.appName}`}</title>
      <meta name="description" content="Backlinks management page" />

      <BacklinksView />
    </>
  );
}
