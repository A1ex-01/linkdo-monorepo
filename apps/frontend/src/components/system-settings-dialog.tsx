"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useStyleTheme } from "@/providers/style-theme-provider";

export function SystemSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { theme, setTheme } = useTheme();
  const { styleTheme, setStyleTheme } = useStyleTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-7">
        <DialogHeader>
          <DialogTitle className="text-2xl">System settings</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="theme-select" className="text-sm font-medium">
              Appearance
            </Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme-select" className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Choose how LinkDo looks. System will use your device&apos;s theme.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="style-theme-select" className="text-sm font-medium">
              Interface Style
            </Label>
            <Select value={styleTheme} onValueChange={setStyleTheme}>
              <SelectTrigger id="style-theme-select" className="w-full">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="vercel">Vercel</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Choose the visual style of the interface. This works independently
              from the light/dark theme.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
