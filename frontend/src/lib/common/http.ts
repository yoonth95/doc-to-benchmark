interface ApiErrorBody {
  detail?: string;
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `요청 실패 (status ${response.status})`;
    try {
      const payload = (await response.json()) as ApiErrorBody;
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      // 응답 본문이 없을 수 있음
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}
