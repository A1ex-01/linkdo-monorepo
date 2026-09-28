import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useLinkdoAuth } from "@/lib/auth";
import { MailCheckIcon } from "lucide-react-native";
import * as React from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";

export default function SignInScreen() {
  const { requestCode, verifyCode } = useLinkdoAuth();
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);

  async function submit() {
    setError(undefined);
    setLoading(true);
    try {
      if (!sent) {
        await requestCode(email.trim());
        setSent(true);
      } else {
        await verifyCode(email.trim(), code.trim());
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding" })}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center p-5">
        <View className="mb-8 gap-2">
          <Text variant="h1" className="text-4xl font-bold">
            Linkdo
          </Text>
          <Text className="text-base text-muted-foreground">
            你的任务，只读随行。
          </Text>
        </View>
        <Card>
          <CardHeader>
            <CardTitle>{sent ? "输入验证码" : "登录 Linkdo"}</CardTitle>
            <CardDescription>
              {sent ? `验证码已发送到 ${email}` : "使用桌面端同一个邮箱登录。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {!sent ? (
              <Input
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="you@example.com"
              />
            ) : (
              <Input
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                placeholder="6 位验证码"
              />
            )}
            {error ? (
              <Text className="text-sm text-destructive">{error}</Text>
            ) : null}
            <Button
              disabled={
                loading || (!sent && !email.trim()) || (sent && !code.trim())
              }
              onPress={submit}
            >
              <MailCheckIcon />
              <Text>
                {loading ? "请稍候…" : sent ? "验证并登录" : "发送验证码"}
              </Text>
            </Button>
            {sent ? (
              <Button
                variant="ghost"
                disabled={loading}
                onPress={() => {
                  setSent(false);
                  setCode("");
                }}
              >
                <Text>换一个邮箱</Text>
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <Text className="mt-5 text-center text-xs text-muted-foreground">
          移动端仅支持浏览，不会修改你的任务或设置。
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
