import { CONFIG } from 'src/config-global';

import { TeamsView } from 'src/sections/teams/view';

export default function Page() {
  return (
    <>
      <title>{`Teams - ${CONFIG.appName}`}</title>

      <TeamsView />
    </>
  );
}
