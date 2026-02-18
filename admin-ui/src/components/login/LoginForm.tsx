import { useSubmission } from "@solidjs/router";
import { ArrowRight } from "lucide-solid";
import { Show } from "solid-js";
import { login } from "~/server/auth";

export default function LoginForm() {
  const submission = useSubmission(login);

  const error = () => submission.result?.error ?? null;

  return (
    <form method="post" action={login} class="w-full p-4">
      <h2 class="my-2">Login</h2>
      <div class="mb-4">
        <input
          id="password"
          name="password"
          type="password"
          class="w-full p-2 border rounded-sm focus:ring focus:ring-white focus:outline-0 bg-white/5"
          classList={{
            "border-red-400": !!error(),
            "border-white/20": !error(),
          }}
          disabled={submission.pending}
        />
        <Show when={error()}>
          <div class="text-xs text-red-400 mt-2">{error()}</div>
        </Show>
      </div>
      <button
        type="submit"
        disabled={submission.pending}
        class="flex items-center justify-between px-4 w-full bg-black border border-white/10 py-2 rounded-sm hover:bg-white/5 disabled:opacity-50 cursor-pointer"
      >
        <Show when={submission.pending} fallback="Submit">
          Loading...
        </Show>
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
