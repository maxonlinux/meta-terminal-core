// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

export default function Client() {
  return <StartClient />;
}

const app = document.getElementById("app");
if (!app) throw new Error("App element not found");

mount(() => <StartClient />, app);
