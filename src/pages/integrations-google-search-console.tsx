import { CONFIG } from 'src/config-global';

import { GoogleSearchConsoleConfig } from 'src/sections/integrations/view/google-search-console-config';

export default function Page() {
  return (
    <>
      <title>{`Google Search Console - ${CONFIG.appName}`}</title>

      <GoogleSearchConsoleConfig />
    </>
  );
}
