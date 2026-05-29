export function mockParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

export function mockRequest(body?: Record<string, unknown>, searchParams?: Record<string, string>): Request {
  let url = "http://localhost"
  if (searchParams) {
    const params = new URLSearchParams(searchParams)
    url += `?${params.toString()}`
  }
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function mockGetRequest(urlStr?: string): Request {
  return new Request(urlStr || "http://localhost", { method: "GET" })
}

export async function expectError(res: Response, status: number, messageContains?: string) {
  expect(res.status).toBe(status)
  const data = await res.json()
  expect(data.error).toBeDefined()
  if (messageContains) {
    expect(data.error).toContain(messageContains)
  }
  return data
}
