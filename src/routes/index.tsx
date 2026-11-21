import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Assistente de Investigação de Fraude" },
      { name: "description", content: "Investigue usuários e casos de fraude em linguagem natural, com histórico e governança centralizados." },
      { property: "og:title", content: "Assistente de Investigação de Fraude" },
      { property: "og:description", content: "Camada única de acesso às capacidades de investigação de fraude." },
    ],
  }),
  component: Index,
});

function Index() {
  const { hydrated } = useStore();
  if (!hydrated) return <div className="paper-scene min-h-screen" />;
  return <Navigate to="/dashboard" replace />;
}
