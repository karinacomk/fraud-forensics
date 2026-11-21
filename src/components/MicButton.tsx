import { Loader2, Mic, Square } from "lucide-react";
import { useVoiceInput, type VoiceState } from "@/lib/voice";

function fmtElapsed(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function MicButton({
  onTranscript,
  disabled,
  className,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const { state, elapsed, error, start, stop, reset } = useVoiceInput(onTranscript);
  const active = state === "recording" || state === "requesting" || state === "transcribing";

  function handleClick() {
    if (state === "recording" || state === "requesting") stop();
    else if (state === "transcribing") return;
    else if (state === "error") { reset(); void start(); }
    else void start();
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || state === "transcribing"}
        title={
          state === "recording"
            ? "Parar gravação"
            : state === "transcribing"
              ? "Transcrevendo…"
              : "Gravar áudio"
        }
        aria-label={
          state === "recording" ? "Parar gravação" : state === "transcribing" ? "Transcrevendo" : "Gravar áudio"
        }
        className={`grid size-8 shrink-0 place-items-center rounded-full transition-colors ${
          state === "recording" || state === "requesting"
            ? "bg-destructive text-white animate-pulse-dot"
            : state === "transcribing"
              ? "bg-muted text-ink-soft"
              : "text-muted-foreground hover:bg-muted hover:text-ink"
        } disabled:opacity-40`}
      >
        {state === "transcribing" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : state === "recording" || state === "requesting" ? (
          <Square className="size-3.5" strokeWidth={2.6} />
        ) : (
          <Mic className="size-4" strokeWidth={2} />
        )}
      </button>
      {state === "recording" && (
        <span className="font-mono text-[11px] tabular-nums text-destructive">{fmtElapsed(elapsed)}</span>
      )}
      {state === "transcribing" && <span className="text-[11px] text-muted-foreground">Transcrevendo…</span>}
      {state === "error" && error && <VoiceError message={error} />}
    </span>
  );
}

function VoiceError({ message }: { message: string }) {
  return (
    <span className="max-w-[240px] truncate text-[11px] text-destructive" title={message}>
      {message}
    </span>
  );
}

export type { VoiceState };
