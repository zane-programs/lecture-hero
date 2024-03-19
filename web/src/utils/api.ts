import { useEffect, useState } from "react";

export const API_HOST =
  process.env.NODE_ENV === "production"
    ? "https://lecturehero.net/api"
    : "http://localhost:5461";

export interface SummaryData {
  id: string;
  /** ISO timestamp string */
  created: string;
  content: string;
  transcript: string;
  title: string;
}

export function getSummary(id: string): Promise<SummaryData> {
  return _fetchApi<SummaryData>(`/v1/summary/get/${encodeURIComponent(id)}`);
}

export function useSummary(id: string): SummaryData | undefined {
  const [summaryData, setSummaryData] = useState<SummaryData | undefined>();

  // useEffect(() => {
  //   let interval: NodeJS.Timer;

  //   async function pollSummary() {
  //     const data = await getSummary(id);
  //     if (data.ready) {
  //       clearInterval(interval);
  //     }
  //     setSummaryData(data);

  //     return data.ready;
  //   }

  //   pollSummary().then((ready) => {
  //     // Polling only if needed
  //     if (!ready) {
  //       interval = setInterval(pollSummary, 6000);
  //     }
  //   });

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [id]);

  useEffect(() => {
    async function fetchData() {
      setSummaryData(await getSummary(id));
    }
    fetchData();
  }, [id]);

  return summaryData;
}

// This function is a crime against TypeScript.
async function _fetchApi<T = any>(
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
