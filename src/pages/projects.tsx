import { CONFIG } from 'src/config-global';

import { ProjectsView } from 'src/sections/projects/view';

export default function Page() {
  return (
    <>
      <title>{`Projects - ${CONFIG.appName}`}</title>

      <ProjectsView />
    </>
  );
}
