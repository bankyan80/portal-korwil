const BASE = 'https://simpeg-tim.vercel.app/api/pegawai';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.searchParams.toString();
  const target = params ? `${BASE}?${params}` : BASE;
  const res = await fetch(target);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
