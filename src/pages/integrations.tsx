import { CONFIG } from 'src/config-global';

import { IntegrationsView } from 'src/sections/integrations/view';

export default function Page() {
  return (
    <>
      <title>{`Integrations - ${CONFIG.appName}`}</title>

      <IntegrationsView />
    </>
  );
}
