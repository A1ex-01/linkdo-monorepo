import { cn } from "@/lib/utils";
import { Crepe } from "@milkdown/crepe";
// import { getMarkdown } from '@milkdown/utils'
//@ts-ignore
import "@milkdown/crepe/theme/common/style.css";
//@ts-ignore
import "@milkdown/crepe/theme/frame.css";
import {
  Milkdown,
  MilkdownProvider,
  useEditor,
  useInstance,
} from "@milkdown/react";
interface IProps {
  className?: string;
  value: string;
  onChange: (value: string) => void;
}
const MilkdownEditor = ({ value, onChange }: IProps) => {
  const [isLoading, getInstance] = useInstance();

  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: value,
      features: {
        "block-edit": false,
      },
    });
    crepe.on((api) => {
      api.markdownUpdated((ctx, markdown) => {
        onChange?.(markdown as string);
      });
    });
    root.autofocus = true;

    return crepe;
  }, []);

  return (
    <div>
      <Milkdown />
    </div>
  );
};
export function AMarkdownEditor({ className, value, onChange }: IProps) {
  return (
    <div
      className={cn(
        "notion-comment-editor bg-input! text-foreground w-full",
        className,
      )}
    >
      <MilkdownProvider>
        <MilkdownEditor value={value} onChange={onChange} />
      </MilkdownProvider>
    </div>
  );
}
