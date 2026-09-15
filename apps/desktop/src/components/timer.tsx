import { cn } from "@/lib/utils";
import { padStart } from "lodash-es";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

interface CountDownProps {
  seconds: number; // 默认倒计时秒数
  onFinish: () => void;
  className?: string;
  color: string;
  fontSize: number;
  showSeconds?: boolean;
  showDays?: boolean;
}

interface StopWatchProps {
  className?: string;
  color: string;
  fontSize: number;
  showSeconds?: boolean;
  showDays?: boolean;
  seconds: number;
  onTick?: (elapsed: number) => void;
}

function ScrollDigit({ value, fontSize }: { value: string; fontSize: number }) {
  const DIGIT_HEIGHT = fontSize * 1.25;
  return (
    <div
      style={{
        height: DIGIT_HEIGHT,
        overflow: "hidden",
      }}
      className="overflow-hidden"
    >
      <div
        style={{
          transition: "transform 0.4s cubic-bezier(.28,.64,.22,1)",
          transform: `translateY(-${Number(value) * DIGIT_HEIGHT}px)`,
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: DIGIT_HEIGHT,
              lineHeight: `${DIGIT_HEIGHT}px`,
            }}
            className="flex items-center justify-center font-bold"
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CountDown(props: CountDownProps) {
  const {
    seconds,
    onFinish,
    className,
    color,
    fontSize,
    showSeconds = true,
    showDays = false,
  } = props;
  const [remain, setRemain] = useState(seconds);
  useEffect(() => {
    setRemain(seconds);
  }, [seconds]);
  useEffect(() => {
    if (remain <= 0) {
      onFinish();
      return;
    }
    const timer = setTimeout(() => setRemain((r) => r - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remain]);

  const timeConfig = useMemo(() => {
    if (showDays) {
      const days = Math.floor(remain / 86400);
      const hours = Math.floor((remain % 86400) / 3600);
      const minutes = Math.floor((remain % 3600) / 60);
      const secs = remain % 60;
      const dayDigits = padStart(days.toString(), 2, "0").split("");
      const hourDigits = padStart(hours.toString(), 2, "0").split("");
      const minDigits = padStart(minutes.toString(), 2, "0").split("");
      const secDigits = padStart(secs.toString(), 2, "0").split("");
      return [
        dayDigits,
        hourDigits,
        minDigits,
        showSeconds && secDigits,
      ].filter(Boolean) as string[][];
    }
    const hours = Math.floor(remain / 3600);
    const minutes = Math.floor((remain % 3600) / 60);
    const secs = remain % 60;
    const hourDigits = padStart(hours.toString(), 2, "0").split("");
    const minDigits = padStart(minutes.toString(), 2, "0").split("");
    const secDigits = padStart(secs.toString(), 2, "0").split("");
    return [hourDigits, minDigits, showSeconds && secDigits].filter(
      Boolean,
    ) as string[][];
  }, [remain, showDays, showSeconds]);

  return (
    <div
      className={cn(
        "relative flex w-max items-center gap-1 bg-transparent px-2 font-[monospace]",
        className,
      )}
      style={{
        fontSize: fontSize,
      }}
    >
      {/* top shadow */}
      <div
        className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-[22%]"
        style={{
          background: `linear-gradient(to bottom, ${color}, transparent)`,
        }}
      />
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-[22%]"
        style={{
          background: `linear-gradient(to top, ${color}, transparent)`,
        }}
      />
      {timeConfig.map((digits, i) => (
        <Fragment key={`${i}`}>
          {digits.map((d, i) => (
            <Fragment key={`${i}`}>
              <ScrollDigit key={`${i}`} value={d} fontSize={fontSize} />
            </Fragment>
          ))}
          {i < timeConfig.length - 1 && (
            <span className="-translate-y-[8%] font-bold">:</span>
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function StopWatch(props: StopWatchProps) {
  const {
    className,
    color,
    fontSize,
    showSeconds = true,
    showDays = false,
    onTick,
    seconds,
  } = props;

  const [elapsed, setElapsed] = useState(seconds);
  const timer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    setElapsed(seconds);
  }, [seconds]);
  useEffect(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    timer.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (onTick) onTick(next);
        return next;
      });
    }, 1000);

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const timeConfig = useMemo(() => {
    const remain = elapsed;
    if (showDays) {
      const days = Math.floor(remain / 86400);
      const hours = Math.floor((remain % 86400) / 3600);
      const minutes = Math.floor((remain % 3600) / 60);
      const secs = remain % 60;
      const dayDigits = padStart(days.toString(), 2, "0").split("");
      const hourDigits = padStart(hours.toString(), 2, "0").split("");
      const minDigits = padStart(minutes.toString(), 2, "0").split("");
      const secDigits = padStart(secs.toString(), 2, "0").split("");
      return [
        dayDigits,
        hourDigits,
        minDigits,
        showSeconds && secDigits,
      ].filter(Boolean) as string[][];
    }
    const hours = Math.floor(remain / 3600);
    const minutes = Math.floor((remain % 3600) / 60);
    const secs = remain % 60;
    const hourDigits = padStart(hours.toString(), 2, "0").split("");
    const minDigits = padStart(minutes.toString(), 2, "0").split("");
    const secDigits = padStart(secs.toString(), 2, "0").split("");
    return [hourDigits, minDigits, showSeconds && secDigits].filter(
      Boolean,
    ) as string[][];
  }, [elapsed, showDays, showSeconds]);

  return (
    <div
      className={cn(
        "relative flex w-max items-center gap-0 bg-transparent px-2 font-[monospace]",
        className,
      )}
      style={{
        fontSize: fontSize,
      }}
    >
      {/* top shadow */}
      <div
        className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-[22%]"
        style={{
          background: `linear-gradient(to bottom, ${color}, transparent)`,
        }}
      />
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-[22%]"
        style={{
          background: `linear-gradient(to top, ${color}, transparent)`,
        }}
      />
      {timeConfig.map((digits, i) => (
        <Fragment key={i}>
          {digits.map((d, j) => (
            <Fragment key={j}>
              <ScrollDigit key={j} value={d} fontSize={fontSize} />
            </Fragment>
          ))}
          {i < timeConfig.length - 1 && (
            <span className="-translate-y-[8%] font-bold">:</span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
