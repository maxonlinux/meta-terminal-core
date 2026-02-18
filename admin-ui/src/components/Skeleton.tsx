import type { JSX } from "solid-js";
import { cls } from "~/utils/general";

export const Skeleton = (props: { class?: string }): JSX.Element => {
  return <div class={cls("bg-neutral-900 animate-pulse", props.class)} />;
};
