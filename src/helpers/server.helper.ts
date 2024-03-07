import {Request} from '@loopback/rest';

export function getServerUrl(req: Request, serverUrl: string): string {
  const proto = req.header('x-forwarded-proto') ?? 'http';
  const url = req.header('host');

  return url ? `${proto}://${url}` : serverUrl;
}
