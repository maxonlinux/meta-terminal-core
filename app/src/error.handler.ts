export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export const appErrorResponse = (error: AppError) =>
  new Response(JSON.stringify({ error: error.message }), {
    status: error.statusCode,
    headers: { "Content-Type": "application/json" },
  });
