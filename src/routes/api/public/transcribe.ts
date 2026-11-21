import { createFileRoute } from "@tanstack/react-router";

const AUDIO_EXT: Record<string, string> = {
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "mp4",
  "audio/ogg": "ogg",
};
const MAX_BYTES = 14 * 1024 * 1024; // gemini-3.5-transcribe limit

export const Route = createFileRoute("/api/public/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fail = (status: number, error: string, detail?: string) =>
          Response.json({ error, ...(detail ? { detail } : {}) }, { status });

        try {
          const form = await request.formData();
          const file = form.get("audio");
          if (!(file instanceof File) || file.size === 0) {
            return fail(400, "Envie um arquivo de áudio no campo 'audio'.");
          }
          if (file.size > MAX_BYTES) {
            return fail(413, "Áudio muito grande (limite de 14 MB). Grave um trecho mais curto.");
          }
          const mime = (file.type || "audio/wav").split(";")[0] ?? "audio/wav";
          if (!mime.startsWith("audio/")) {
            return fail(400, `Tipo de arquivo não suportado: ${mime}`);
          }
          const ext = AUDIO_EXT[mime] ?? "wav";

          const upstream = new FormData();
          upstream.append("model", "google/gemini-3.5-transcribe");
          upstream.append("file", file, `recording.${ext}`);
          upstream.append("stream", "true");

          const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]!}` },
            body: upstream,
          });
          if (!resp.ok || !resp.body) {
            const detail = await resp.text().catch(() => "");
            console.error(`Transcription gateway error [${resp.status}]: ${detail}`);
            return fail(resp.status, "A transcrição falhou. Tente gravar novamente.", detail.slice(0, 300));
          }
          return new Response(resp.body, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
          });
        } catch (e) {
          console.error("Transcription route error:", e);
          return fail(500, "Erro inesperado ao transcrever o áudio.");
        }
      },
    },
  },
});
