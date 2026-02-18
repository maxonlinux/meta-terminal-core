import type { RouteSectionProps } from "@solidjs/router";
import { Header } from "~/components/dashboard/Header";

export default function Layout(props: RouteSectionProps) {
  return (
    <main class="flex flex-col h-dvh">
      <Header />
      {props.children}
      <footer class="text-current/50 text-xs text-center p-2">
        Use with care!
      </footer>
    </main>
  );
}
