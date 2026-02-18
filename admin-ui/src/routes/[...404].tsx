import { ArrowRight } from "lucide-solid";

export default function NotFound() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <div class="flex flex-col items-center justify-center text-sm max-md:px-4 py-20">
        <h1 class="text-4xl md:text-5xl font-bold  bg-white bg-clip-text text-transparent">
          404 Not Found
        </h1>
        <div class="h-px w-80 rounded bg-gray-400 my-5 md:my-7"></div>
        <p class="md:text-xl text-gray-400 max-w-lg text-center">
          The page you are looking for does not exist or has been moved.
        </p>
        <a
          href="/"
          class="group flex items-center gap-1 bg-white hover:bg-gray-200 px-7 py-2.5 text-gray-800 rounded-full mt-10 font-medium active:scale-95 transition-all"
        >
          Back to Home
          <ArrowRight class="size-6" />
        </a>
      </div>
    </main>
  );
}
