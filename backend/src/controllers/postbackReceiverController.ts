import { Request, Response } from 'express';
import { getClientIp } from '../utils/clientIp';
import { processPostback, PostbackRequest } from '../services/postback/receiver';

/** 1x1 transparent GIF returned by the image pixel. */
const PIXEL_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const PIXEL_HTML = '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';
const NO_CACHE = 'no-store, no-cache, must-revalidate';

function toPostbackRequest(req: Request): PostbackRequest {
  return {
    method: req.method,
    params: { ...req.query, ...(req.body && typeof req.body === 'object' ? req.body : {}) },
    headers: req.headers,
    ipAddress: getClientIp(req),
  };
}

/** S2S Conversion Postback (GET or POST; query, form or JSON body). Answers with JSON. */
export async function handlePostback(req: Request, res: Response): Promise<void> {
  const result = await processPostback(toPostbackRequest(req));
  res.status(result.httpStatus).json(result.body);
}

/**
 * Image pixel: <img src=".../postback/pixel.jpg?clickid=...">.
 * Always answers 200 with a 1x1 image so the advertiser page never shows a broken image;
 * the real result is in the postback log and the X-Postback-Status header.
 */
export async function handlePixelImage(req: Request, res: Response): Promise<void> {
  const result = await processPostback(toPostbackRequest(req));
  res
    .status(200)
    .set({ 'Content-Type': 'image/gif', 'Cache-Control': NO_CACHE, 'X-Postback-Status': String(result.httpStatus) })
    .send(PIXEL_GIF);
}

/** IFrame pixel: <iframe src=".../postback/pixel.html?clickid=...">. Same rules as the image pixel. */
export async function handlePixelFrame(req: Request, res: Response): Promise<void> {
  const result = await processPostback(toPostbackRequest(req));
  res
    .status(200)
    .set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': NO_CACHE, 'X-Postback-Status': String(result.httpStatus) })
    .send(PIXEL_HTML);
}
