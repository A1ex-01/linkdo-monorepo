import * as React from "react";

import { linkdoApiUrl, useLinkdoAuth } from "./auth";
import { createLinkdoApi } from "./linkdo-api";

export function useLinkdoApi() {
  const { token } = useLinkdoAuth();
  return React.useMemo(
    () =>
      createLinkdoApi({ baseUrl: linkdoApiUrl, getToken: async () => token }),
    [token],
  );
}
