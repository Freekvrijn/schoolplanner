import { ClientOnly, createFileRoute } from "@tanstack/react-router";

import { PlannerApp } from "@/planner/PlannerApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Schoolplanner — lessen, voorbereiding en aantekeningen" },
      { name: "description", content: "Persoonlijke schoolplanner met je Avans-rooster, voorbereidingstaken en aantekeningen per les." },
      { property: "og:title", content: "Schoolplanner" },
      { property: "og:description", content: "Je Avans-rooster met voorbereiding en aantekeningen per les." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div className="min-h-dvh bg-background" aria-busy="true" />}>
      <PlannerApp />
    </ClientOnly>
  );
}

