import axios from "axios";
import { ArrowRight, Loader } from "lucide-solid";
import { createResource, Show } from "solid-js";
import { isServer, Portal } from "solid-js/web";
import { cls } from "../../utils/general";

export const Header = () => {
  const [health, { refetch }] = createResource(async () => {
    if (isServer) return;

    const res = await axios.get("/api/health", {
      withCredentials: true,
      timeout: 8000,
      validateStatus: () => true,
    });

    if (res.status < 200 || res.status >= 300) {
      throw new Error("HEALTH_CHECK_FAILED");
    }

    return res.data;
  });

  const logout = async () => {
    await axios.post("/api/admin/auth/logout", null, {
      withCredentials: true,
      timeout: 8000,
      validateStatus: () => true,
    });

    location.reload();
  };

  const restart = async () => {
    await axios.post("/api/admin/restart", null, {
      withCredentials: true,
      timeout: 8000,
      validateStatus: () => true,
    });

    refetch();
  };

  return (
    <header class="flex items-center justify-between p-2">
      <p class="font-black text-sm">CORE ADMIN</p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          onClick={restart}
          class="flex items-center gap-1 border border-white/10 p-1 px-2 rounded-sm cursor-pointer hover:bg-white/5 text-white"
        >
          <span class="text-sm font-medium">Restart</span>
        </button>
        <button
          type="button"
          onClick={logout}
          class="flex items-center gap-1 border border-red-400/10 p-1 px-2 rounded-sm cursor-pointer hover:bg-red-400/5 text-red-400"
        >
          <span class="text-sm font-medium">Exit</span>
          <ArrowRight size={16} />
        </button>
      </div>
      <Show when={health.error}>
        <Portal mount={document.body}>
          <div
            class={cls(
              "fixed flex items-center justify-center z-50 inset-0 bg-black animate-in fade-in ease-out duration-700",
              "animate-in fade-in ease-out duration-700",
            )}
          >
            <div class="flex items-center gap-2 animate-pulse ease-out">
              <Loader class="animate-spin size-4" />
              <span>Restarting...</span>
            </div>
          </div>
        </Portal>
      </Show>
    </header>
  );
};
