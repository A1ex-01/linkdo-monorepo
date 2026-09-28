import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Loading, Page } from "@/components/page";
import { useLinkdoAuth } from "@/lib/auth";
import { useLinkdoApi } from "@/lib/use-linkdo-api";
import { Link } from "expo-router";
import * as React from "react";
export default function MinePage() {
  const api = useLinkdoApi();
  const { signOut } = useLinkdoAuth();
  const [me, setMe] = React.useState<Awaited<ReturnType<typeof api.getMe>>>();
  React.useEffect(() => {
    api.getMe().then(setMe);
  }, [api]);
  if (!me) return <Loading />;
  return (
    <Page>
      <Card>
        <CardHeader>
          <CardTitle>{me.name}</CardTitle>
          <CardDescription>{me.email || "Linkdo account"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-muted-foreground">
            账户资料为只读；请在桌面端修改。
          </Text>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>App connections</CardTitle>
        </CardHeader>
        <CardContent className="gap-2">
          <Text>Notion · {me.notion_user_id ? "已连接" : "未连接"}</Text>
          <Text>ClickUp · {me.clickup_connected ? "已连接" : "未连接"}</Text>
        </CardContent>
      </Card>
      <Link href="/(app)/settings" asChild>
        <Button variant="outline">
          <Text>Settings</Text>
        </Button>
      </Link>
      <Button variant="outline" onPress={() => void signOut()}>
        <Text>退出登录</Text>
      </Button>
    </Page>
  );
}
