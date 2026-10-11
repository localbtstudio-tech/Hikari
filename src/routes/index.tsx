import { createFileRoute } from "@tanstack/react-router";
import { HikariApp } from "@/components/hikari-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <HikariApp />;
}
