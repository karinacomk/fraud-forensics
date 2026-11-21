import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = "idle" | "requesting" | "recording" | "transcribing" | "error";

const TARGET_RATE = 16000;

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

/** Concatenate PCM chunks, downsample to 16 kHz mono and wrap in a WAV container. */
function encodeWav(chunks: Float32Array[], inRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const flat = new Float32Array(total);
  let pos = 0;
  for (const c of chunks) {
    flat.set(c, pos);
    pos += c.length;
  }
  const ratio = Math.max(1, Math.floor(inRate / TARGET_RATE));
  const outLen = Math.floor(total / ratio);
  const samples = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const s = Math.max(-1, Math.min(1, flat[i * ratio] ?? 0));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const buffer = new ArrayBuffer(44 + outLen * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + outLen * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, TARGET_RATE, true);
  view.setUint32(28, TARGET_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, outLen * 2, true);
  new Int16Array(buffer, 44).set(samples);
  return new Blob([buffer], { type: "audio/wav" });
}

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const chunksRef = useRef<Float32Array[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const stoppedRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const teardown = useCallback(() => {
    nodeRef.current?.disconnect();
    nodeRef.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => { stoppedRef.current = true; teardown(); }, [teardown]);

  // Recording timer
  useEffect(() => {
    if (state !== "recording") return;
    startedAtRef.current = Date.now();
    setElapsed(0);
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [state]);

  const transcribe = useCallback(async (blob: Blob) => {
    if (blob.size < 2048) {
      setState("error");
      setError("A gravação ficou vazia — tente novamente.");
      return;
    }
    setState("transcribing");
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.wav");
      const res = await fetch("/api/public/transcribe", { method: "POST", body: form });
      if (!res.ok || !res.body) {
        let message = "Não foi possível transcrever o áudio.";
        try {
          const body = (await res.json()) as { error?: string; detail?: string };
          if (body.error) message = body.error;
        } catch { /* keep default */ }
        throw new Error(message);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload) as { type?: string; delta?: string; text?: string };
            if (ev.type === "transcript.text.delta" && ev.delta) full += ev.delta;
            if (ev.type === "transcript.text.done" && ev.text) full = ev.text;
          } catch { /* ignore malformed line */ }
        }
      }
      const text = full.trim();
      if (!text) {
        setState("error");
        setError("Não entendi o áudio — fale um pouco mais perto do microfone.");
        return;
      }
      onTranscriptRef.current(text);
      setState("idle");
    } catch (e) {
      if (stoppedRef.current) return;
      setState("error");
      setError(e instanceof Error ? e.message : "Não foi possível transcrever o áudio.");
    }
  }, []);

  const stop = useCallback(() => {
    const chunks = chunksRef.current;
    const rate = ctxRef.current?.sampleRate ?? 48000;
    teardown();
    if (chunks.length === 0) {
      setState("idle");
      return;
    }
    void transcribe(encodeWav(chunks, rate));
  }, [teardown, transcribe]);

  const start = useCallback(async () => {
    stoppedRef.current = false;
    setError(null);
    setState("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState("error");
      setError("Precisamos de acesso ao microfone para gravar.");
      return;
    }
    streamRef.current = stream;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const node = ctx.createScriptProcessor(4096, 1, 1);
    nodeRef.current = node;
    chunksRef.current = [];
    node.onaudioprocess = (e) => chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    source.connect(node);
    node.connect(ctx.destination);
    setState("recording");
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setState("idle");
  }, []);

  return { state, elapsed, error, start, stop, reset };
}
