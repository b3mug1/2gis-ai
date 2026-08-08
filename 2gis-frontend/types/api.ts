
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  is_active: boolean;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

export interface MessageResponse {
  message: string;
}

export interface SearchRequest {
  query: string;
  coordinates?: Coordinates;
  locale?: string;
}

export interface SearchIntent {
  query: string;
  location_text: string | null;
  coordinates: Coordinates;
  radius_m: number;
  budget_kzt: number | null;
  party_size: number;
  cuisine: string | null;
  place_type: string | null;
  amenities: string[];
  mood: string | null;
  sort_by: string;
  open_now: boolean;
  min_rating: number;
  price_category: string | null;
  requires_parking: boolean;
  requires_quiet: boolean;
  laptop_friendly: boolean;
  romantic: boolean;
}

export interface PlaceRecommendation {
  place_id: string;
  name: string;
  rating: number | null;
  walking_time: number | null;
  pros: string[];
  cons: string[];
  reason: string;
  confidence: number;
  score: number;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categories: string[];
  distance_m: number | null;
  price_category: string | null;
  opening_hours: string | null;
  phone: string | null;
  url: string | null;
  photos?: string[];
}

export interface SearchResponse {
  recommendation: PlaceRecommendation;
  alternatives: PlaceRecommendation[];
  intent: SearchIntent;
  source: string;
  generated_at: string;
}

export interface FavoriteCreateRequest {
  place_id: string;
  place_name: string;
  payload: Record<string, unknown>;
  note?: string | null;
}

export interface FavoriteResponse {
  id: string;
  place_id: string;
  place_name: string;
  payload: Record<string, unknown>;
  note: string | null;
  created_at: string;
}

export interface SearchHistoryResponse {
  id: string;
  query: string;
  intent: Record<string, unknown>;
  result: Record<string, unknown>;
  created_at: string;
}

export interface SearchStatisticsResponse {
  stat_date: string;
  user_id: string | null;
  total_searches: number;
  successful_searches: number;
}

export interface HealthResponse {
  status: string;
  database: string;
  redis: string;
  external_services: Record<string, string>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  searchResponse?: SearchResponse;
  timestamp: Date;
  isStreaming?: boolean;
}

export type SortOption = "date_desc" | "date_asc" | "name_asc" | "rating_desc";
