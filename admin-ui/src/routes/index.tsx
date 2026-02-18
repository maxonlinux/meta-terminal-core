import { redirect, type RouteDefinition, useNavigate } from "@solidjs/router";
import { onMount } from "solid-js";

export const route = {
  preload: () => {
    return redirect("/dashboard");
  },
} satisfies RouteDefinition;

export default function Index() {
  const navigate = useNavigate();

  onMount(() => {
    navigate("/dashboard", { replace: true });
  });

  return null;
}
