import { type TSchema, Type } from "@sinclair/typebox";

export const ErrorResponse = Type.Object({
  error: Type.String(),
});

export const BadRequestResponse = {
  description: "Bad Request",
  content: {
    "application/json": {
      schema: ErrorResponse,
    },
  },
};

export const NotFoundResponse = {
  description: "Not Found",
  content: {
    "application/json": {
      schema: ErrorResponse,
    },
  },
};

export const ServerErrorResponse = {
  description: "Internal Server Error",
  content: {
    "application/json": {
      schema: ErrorResponse,
    },
  },
};

export const SuccessResponse = <T extends TSchema>(schema: T) => ({
  description: "Success",
  content: {
    "application/json": {
      schema: schema,
    },
  },
});
