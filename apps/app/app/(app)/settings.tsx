import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Page } from "@/components/page";
export default function SettingsPage() {
  return (
    <Page>
      <Card>
        <CardHeader>
          <CardTitle>App settings</CardTitle>
          <CardDescription>移动端只读模式</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-muted-foreground">
            主题、界面样式、账户资料、来源连接及状态映射仍完整可见，但所有修改均需要在桌面端完成。
          </Text>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>任务小组件</CardTitle>
          <CardDescription>iOS 中型与大型 Widget</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-muted-foreground">
            刷新 Collections 后会同步任务快照。需要 iOS development build。
          </Text>
        </CardContent>
      </Card>
    </Page>
  );
}
