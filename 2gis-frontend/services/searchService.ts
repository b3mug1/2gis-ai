import { api, getAccessToken } from "@/lib/api";
import type {
  ComparePlacesRequest,
  ComparePlacesResponse,
  PlaceRecommendation,
  SearchIntent,
  SearchRequest,
  SearchResponse,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export interface StreamEvent {
  event: "status" | "intent" | "places" | "chunk" | "done";
  data: any;
}

export const searchService = {
  search: async (data: SearchRequest): Promise<SearchResponse> => {
    const res = await api.post<SearchResponse>("/search", data);
    return res.data;
  },

  compare: async (data: ComparePlacesRequest): Promise<ComparePlacesResponse> => {
    const res = await api.post<ComparePlacesResponse>("/search/compare", data);
    return res.data;
  },

  searchStream: async (
    data: SearchRequest,
    onEvent: (event: StreamEvent) => void
  ): Promise<SearchResponse> => {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/search/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalResponse: SearchResponse | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split("\n");
        let eventName = "message";
        let eventDataRaw = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventName = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            eventDataRaw = line.slice(6).trim();
          }
        }

        if (eventDataRaw) {
          try {
            const parsedData = JSON.parse(eventDataRaw);
            onEvent({ event: eventName as StreamEvent["event"], data: parsedData });
            if (eventName === "done") {
              finalResponse = parsedData as SearchResponse;
            }
          } catch {
            onEvent({ event: eventName as StreamEvent["event"], data: eventDataRaw });
          }
        }
      }
    }

    if (!finalResponse) {
      // Fallback: standard API search if stream didn't yield done event
      return await searchService.search(data);
    }

    return finalResponse;
  },
};

