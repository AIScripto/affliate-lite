import { Router, Request, Response, NextFunction, RequestHandler } from 'express';

type AnyHandler = (req: Request, res: Response, next: NextFunction) => unknown;

/**
 * Express 4 does not catch errors thrown inside async handlers.
 * Without this wrapper, one failed database call becomes an unhandled
 * promise rejection, and Node stops the whole server process.
 * The wrapper sends the error to the global error handler instead.
 */
export function asyncHandler(fn: AnyHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  };
}

const ROUTE_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'use', 'all'] as const;

/** Error middleware (4 arguments) and nested routers must be passed through unchanged. */
function wrapArg(arg: unknown): unknown {
  if (typeof arg !== 'function') return arg;
  const isErrorMiddleware = arg.length === 4;
  const isRouter = 'stack' in arg;
  if (isErrorMiddleware || isRouter) return arg;
  return asyncHandler(arg as AnyHandler);
}

/**
 * Drop-in replacement for express.Router() where every handler and middleware
 * is wrapped with asyncHandler, so no route can crash the process.
 */
export function createRouter(): Router {
  const router = Router();
  for (const method of ROUTE_METHODS) {
    const original = (router[method] as (...a: unknown[]) => Router).bind(router);
    (router as unknown as Record<string, unknown>)[method] = (...args: unknown[]) =>
      original(...args.map(wrapArg));
  }
  return router;
}
