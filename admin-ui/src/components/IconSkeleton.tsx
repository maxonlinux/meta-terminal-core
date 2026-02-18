import type { Component } from "solid-js";
import { cls } from "~/utils/general";

export const IconSkeleton = (props: {
  class?: string;
  icon: Component<{ class?: string }>;
}) => {
  return (
    <props.icon class={cls("text-neutral-900 animate-pulse", props.class)} />
  );
};
