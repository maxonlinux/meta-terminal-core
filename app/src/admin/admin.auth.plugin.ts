import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { config } from "@/env.config";

export const adminAuthPlugin = new Elysia({ name: "admin-auth" }).use(
  jwt({
    name: "jwt",
    secret: config.JWT_SECRET,
    exp: "1d",
  }),
);
