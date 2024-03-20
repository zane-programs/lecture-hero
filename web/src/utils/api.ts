import { useEffect, useState } from "react";

export const API_HOST =
  // process.env.NODE_ENV === "production"
  true ? "https://api.lecturehero.net" : "http://localhost:5461";

export interface SummaryData {
  id: string;
  /** ISO timestamp string */
  created: string;
  content: string;
  transcript: string;
  title: string;
}

export function getSummary(id: string): Promise<SummaryData> {
  return fetchApi<SummaryData>(`/v1/summary/get/${encodeURIComponent(id)}`);
}

export function useSummary(id: string): SummaryData | undefined {
  const [summaryData, setSummaryData] = useState<SummaryData | undefined>();

  useEffect(() => {
    async function fetchData() {
      setSummaryData(await getSummary(id));
    }
    fetchData();
  }, [id]);

  return summaryData;
}

export async function createAccount(
  username: string,
  password: string
): Promise<void> {
  await fetchApi<any>("/v1/register", {
    method: "PUT",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

// This function is a crime against TypeScript.
export async function fetchApi<T = any>(
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const data: { data: T } | { error: string } = await (
    await fetch(API_HOST + endpoint, init)
  ).json();

  if ((data as any)?.error) {
    throw new Error("API Error! " + (data as any).error);
  }

  return (data as { data: T }).data;
}
