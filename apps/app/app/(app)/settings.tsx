import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import {
  type AppearanceMode,
  type StyleTheme,
  useAppAppearance,
} from "@/lib/appearance";
import { Page } from "@/components/page";

const appearanceOptions: Array<{
  value: AppearanceMode;
  label: string;
  description: string;
}> = [
  { value: "light", label: "浅色", description: "始终使用浅色外观" },
  { value: "dark", label: "深色", description: "始终使用深色外观" },
  { value: "system", label: "跟随系统", description: "使用设备当前外观" },
];

const styleOptions: Array<{
  value: StyleTheme;
  label: string;
  description: string;
}> = [
  { value: "default", label: "Default", description: "平衡的 Linkdo 默认风格" },
  { value: "twitter", label: "Twitter", description: "明亮蓝色与更圆润的卡片" },
  { value: "vercel", label: "Vercel", description: "克制的黑白与紧凑圆角" },
];

export default function SettingsPage() {
  const { mode, resolvedColorScheme, setMode, setStyleTheme, styleTheme } =
    useAppAppearance();

  return (
    <Page>
      <Card>
        <CardHeader>
          <CardTitle>外观</CardTitle>
          <CardDescription>
            与桌面端一致：明暗色和界面主题是两项独立设置。
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          {appearanceOptions.map((option) => {
            const selected = mode === option.value;
            return (
              <Button
                className="h-auto items-start justify-center py-3"
                key={option.value}
                onPress={() => setMode(option.value)}
                variant={selected ? "default" : "outline"}
              >
                <Text className="font-semibold">{option.label}</Text>
                <Text
                  className={
                    selected
                      ? "text-xs text-primary-foreground/75"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {option.description}
                </Text>
              </Button>
            );
          })}
          <Text className="text-xs text-muted-foreground">
            当前生效：{resolvedColorScheme === "dark" ? "深色" : "浅色"}
          </Text>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>界面主题</CardTitle>
          <CardDescription>
            会同步改变页面 token、导航和 Liquid Glass Tab 的配色。
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          {styleOptions.map((option) => {
            const selected = styleTheme === option.value;
            return (
              <Button
                className="h-auto items-start justify-center py-3"
                key={option.value}
                onPress={() => setStyleTheme(option.value)}
                variant={selected ? "default" : "outline"}
              >
                <Text className="font-semibold">{option.label}</Text>
                <Text
                  className={
                    selected
                      ? "text-xs text-primary-foreground/75"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {option.description}
                </Text>
              </Button>
            );
          })}
          <Text className="text-xs text-muted-foreground">
            此偏好仅保存在本机，不会修改 Linkdo 数据或桌面端设置。
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
