import { useEffect, useState } from "react";

export const API_HOST = "http://localhost:5461";

export interface SummaryData {
  id: string;
  title: string;
  ready: boolean;
  data?: string;
}

export function getSummary(id: string): Promise<SummaryData> {
  return _fetchApi<SummaryData>(`/summary/${encodeURIComponent(id)}`);
}

export function useSummary(id: string): SummaryData | undefined {
  const [summaryData, setSummaryData] = useState<SummaryData | undefined>();

  useEffect(() => {
    let interval: NodeJS.Timer;

    async function pollSummary() {
      const data = await getSummary(id);
      if (data.ready) {
        clearInterval(interval);
      }
      setSummaryData(data);

      return data.ready;
    }

    pollSummary().then((ready) => {
      // Polling only if needed
      if (!ready) {
        interval = setInterval(pollSummary, 6000);
      }
    });

    return () => {
      clearInterval(interval);
    };
  }, [id]);

  return summaryData;
}

async function _fetchApi<T = any>(
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  return (await (await fetch(API_HOST + endpoint, init)).json()) as T;
}
