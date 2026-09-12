import { Button } from "@/components/ui/button";
import {
  exchangeLinkCode,
  getLinkOAuthUrl,
  type LinkPlatform,
} from "@/services/link";
import { onUrl, start } from "@fabianlars/tauri-plugin-oauth";
import { open } from "@tauri-apps/plugin-shell";
import toast from "react-hot-toast";

const platformLabel: Record<LinkPlatform, string> = {
  notion: "Notion",
  clickup: "ClickUp",
};

// The Tauri OAuth listener is process-wide. Remove it as soon as its callback
// is handled so a later connection attempt for another provider cannot submit
// its authorization code to the wrong backend endpoint.
export async function launchDesktopLinkOAuth(
  platform: LinkPlatform,
  onConnected?: () => Promise<unknown> | void,
) {
  let unlisten: (() => void) | undefined;

  try {
    await start({ ports: [2222] });
    unlisten = await onUrl(async (callbackURL) => {
      unlisten?.();
      unlisten = undefined;

      const url = new URL(callbackURL);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state) {
        toast.error(
          `${platformLabel[platform]} authorization response is incomplete`,
        );
        return;
      }

      try {
        const response = await exchangeLinkCode(platform, code, state);
        if (!response.success) {
          toast.error(`Failed to connect ${platformLabel[platform]}`);
          return;
        }
        await onConnected?.();
        toast.success(`${platformLabel[platform]} connected`);
      } catch {
        toast.error(`Failed to connect ${platformLabel[platform]}`);
      }
    });

    const response = await getLinkOAuthUrl(platform);
    if (!response.success || !response.data?.url) {
      throw new Error(
        `Failed to start ${platformLabel[platform]} authorization`,
      );
    }
    await open(response.data.url);
  } catch (error: any) {
    if (error?.startsWith("Address already in use")) {
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? "animate-custom-enter" : "animate-custom-leave"
          } bg-background border-border flex w-[300px] max-w-md items-center rounded-lg border shadow-lg`}
        >
          <div className="w-0 flex-1 p-4">
            <div className="flex items-start">
              {/* <div className="flex-shrink-0 pt-0.5">
                {platformLabel[platform]}
              </div> */}
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">请打开授权链接</p>
              </div>
            </div>
          </div>
          <div className="border-border flex border-l pr-4">
            <Button
              variant={"default"}
              // className="text-blue-500"
              onClick={async () => {
                const response = await getLinkOAuthUrl(platform);
                if (!response.success || !response.data?.url) {
                  throw new Error(
                    `Failed to start ${platformLabel[platform]} authorization`,
                  );
                }
                await open(response.data.url);
                toast.dismiss(t.id);
              }}
            >
              打开授权链接
            </Button>
          </div>
        </div>
      ));
    }

    unlisten?.();
  }
}
