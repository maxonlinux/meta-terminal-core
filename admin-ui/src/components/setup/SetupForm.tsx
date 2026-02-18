import { useSubmission } from "@solidjs/router";
import { ArrowRight } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { setup } from "~/server/auth";

export default function SetupForm() {
  const submission = useSubmission(setup);
  const [password, setPassword] = createSignal("");
  const [repeatPassword, setRepeatPassword] = createSignal("");
  const [clientError, setClientError] = createSignal<string | null>(null);

  const handleSubmit = (event: SubmitEvent) => {
    if (password() !== repeatPassword()) {
      event.preventDefault();
      setClientError("Passwords do not match");
      return;
    }

    setClientError(null);
  };

  return (
    <form
      method="post"
      action={setup}
      class="w-full p-4"
      onSubmit={handleSubmit}
    >
      <label class="block my-2 font-medium" for="password">
        Setup password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        minlength={6}
        class="w-full p-2 border border-white/10 rounded-sm focus:ring focus:ring-white focus:outline-0 bg-white/5"
        disabled={submission.pending}
        value={password()}
        onInput={(e) => {
          setPassword(e.currentTarget.value);
          if (clientError()) setClientError(null);
        }}
      />

      <label class="block my-2 font-medium" for="repeat-password">
        Repeat password
      </label>
      <input
        id="repeat-password"
        name="repeatPassword"
        type="password"
        required
        minlength={6}
        class="w-full p-2 border border-white/10 rounded-sm focus:ring focus:ring-white focus:outline-0 bg-white/5"
        disabled={submission.pending}
        value={repeatPassword()}
        onInput={(e) => {
          setRepeatPassword(e.currentTarget.value);
          if (clientError()) setClientError(null);
        }}
      />

      <div class="mt-4">
        <Show when={clientError()}>
          {(message) => <p class="mb-4 text-sm text-red-400">{message()}</p>}
        </Show>

        <Show when={submission.result?.error}>
          {(message) => <p class="mb-4 text-sm text-red-400">{message()}</p>}
        </Show>

        <Show when={submission.error && !submission.result}>
          <p class="mb-4 text-sm text-red-400">Request failed</p>
        </Show>

        <button
          type="submit"
          disabled={submission.pending}
          class="flex items-center justify-between px-4 w-full bg-black border border-white/10 font-semibold py-2 rounded-sm hover:bg-white/5 disabled:opacity-50 cursor-pointer"
        >
          <Show when={submission.pending} fallback="Submit">
            Loading...
          </Show>
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
