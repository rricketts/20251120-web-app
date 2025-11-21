import { CONFIG } from 'src/config-global';

import { CompetitorsView } from 'src/sections/competitors/view';

export default function Page() {
  return (
    <>
      <title>{`Competitors - ${CONFIG.appName}`}</title>
      <meta name="description" content="Competitor analysis page" />

      <CompetitorsView />
    </>
  );
}
