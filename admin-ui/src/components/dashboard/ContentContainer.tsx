import type { JSX } from "solid-js";
import { cls } from "../../utils/general";

export const ContentContainer = (props: {
  children: JSX.Element;
  class?: string;
}) => {
  return (
    <div
      class={cls(
        "flex flex-col min-h-0 bg-black rounded-sm border border-white/10",
        props.class,
      )}
    >
      {props.children}
    </div>
  );
};
