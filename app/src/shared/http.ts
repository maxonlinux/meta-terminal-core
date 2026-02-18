import { t } from "elysia";

export const ErrorResponse = t.Object({
  error: t.String(),
});

export const SuccessResponse = t.Object({
  success: t.Boolean(),
});

export const SuccessTrueResponse = t.Object({
  success: t.Literal(true),
});
