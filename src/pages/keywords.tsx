import { CONFIG } from 'src/config-global';

import { KeywordsView } from 'src/sections/keywords/view';

export default function Page() {
  return (
    <>
      <title>{`Keywords - ${CONFIG.appName}`}</title>
      <meta name="description" content="Keyword management page" />

      <KeywordsView />
    </>
  );
}
