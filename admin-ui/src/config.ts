const core = process.env.CORE_URL;
if (!core) {
  throw new Error("CORE_URL is not defined");
}

export const config = {
  core,
};
