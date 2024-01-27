import { type NextRequest } from 'next/server'

const {log} = console;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- ignore
export function GET(request: NextRequest) {
  const {searchParams} = request.nextUrl;
  const query = searchParams.get('q');
  // query is "hello" for /api/search?query=hello
  log({query});
}
