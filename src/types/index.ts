// TypeScript types for Family News Service

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  birth_date?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyGroup {
  id: string;
  group_name: string;
  leader_id: string;
  invite_code: string;
  deadline_type: 'SECOND_SUNDAY' | 'FOURTH_SUNDAY';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface Recipient {
  id: string;
  group_id: string;
  name: string;
  birth_date?: string;
  phone?: string;
  profile_image_url?: string;
  address: string;
  address_detail?: string;
  postal_code?: string;
  road_address?: string;
  jibun_address?: string;
  address_type?: string;
  latitude?: number;
  longitude?: number;
  region_1depth?: string;
  region_2depth?: string;
  region_3depth?: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  group_id: string;
  user_id: string;
  recipient_id: string;
  relationship: 'SON' | 'DAUGHTER' | 'SON_IN_LAW' | 'DAUGHTER_IN_LAW' | 'GRANDSON' | 'GRANDDAUGHTER';
  role: 'LEADER' | 'MEMBER';
  joined_at: string;
  user?: User;
}

export interface Issue {
  id: string;
  group_id: string;
  issue_number: number;
  deadline_date: string;
  status: 'OPEN' | 'CLOSED' | 'PUBLISHED';
  created_at: string;
  closed_at?: string;
  published_at?: string;
  days_until_deadline?: number;
}

export interface Post {
  id: string;
  issue_id: string;
  author_id: string;
  content: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
  author_name?: string;
  author?: User;
}

export interface Book {
  id: string;
  issue_id: string;
  pdf_url?: string;
  production_status: 'PENDING' | 'COMPLETED';
  delivery_status: 'PENDING' | 'SHIPPING' | 'DELIVERED';
  tracking_number?: string;
  produced_at?: string;
  shipped_at?: string;
  delivered_at?: string;
}

export interface Subscription {
  id: string;
  group_id: string;
  user_id: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  start_date: string;
  end_date?: string;
  next_billing_date?: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  detail?: string;
}

export interface KakaoLoginResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  user: User;
  is_new_user: boolean;
}

export interface FamilySetupData {
  group_name: string;
  deadline_type: 'SECOND_SUNDAY' | 'FOURTH_SUNDAY';
  leader_relationship: 'SON' | 'DAUGHTER' | 'SON_IN_LAW' | 'DAUGHTER_IN_LAW';
  recipient_name: string;
  recipient_address: string;
  recipient_address_detail?: string;
  recipient_postal_code?: string;
  recipient_phone?: string;
  recipient_road_address?: string;
  recipient_jibun_address?: string;
  recipient_address_type?: string;
  recipient_latitude?: number;
  recipient_longitude?: number;
  recipient_region_1depth?: string;
  recipient_region_2depth?: string;
  recipient_region_3depth?: string;
}

export interface PostCreate {
  content: string;
  image_urls?: string[];
}

export interface ImageUploadResponse {
  image_urls: string[];
  collage_layout?: string;
}

export interface PaymentInfo {
  payment_method: string;
  amount: number;
  redirect_url?: string;
  mobile_url?: string;
}

export interface AddressSearchResult {
  address_type?: string;
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  road_address?: {
    address_name: string;
    building_name?: string;
    main_building_no: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    road_name: string;
    sub_building_no?: string;
    underground_yn: string;
    zone_no: string;
  };
  x: string; // 경도
  y: string; // 위도
}

export interface KakaoAddressResponse {
  documents: AddressSearchResult[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

export interface AddressData {
  fullAddress: string;
  roadAddress?: string;
  jibunAddress: string;
  postalCode?: string;
  region1: string; // 시/도
  region2: string; // 구/군
  region3: string; // 동/면
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  addressType?: 'ROAD' | 'JIBUN';
}

// 관계 타입 한글명 매핑
export const RELATIONSHIP_LABELS: Record<string, string> = {
  SON: '아들',
  DAUGHTER: '딸',
  SON_IN_LAW: '사위',
  DAUGHTER_IN_LAW: '며느리',
  GRANDSON: '손자',
  GRANDDAUGHTER: '손녀'
};

// 마감일 타입 한글명 매핑
export const DEADLINE_TYPE_LABELS: Record<string, string> = {
  SECOND_SUNDAY: '매월 둘째 주 일요일',
  FOURTH_SUNDAY: '매월 넷째 주 일요일'
};

// 상태 타입 한글명 매핑
export const STATUS_LABELS: Record<string, string> = {
  OPEN: '진행중',
  CLOSED: '마감',
  PUBLISHED: '발행완료',
  PENDING: '대기중',
  COMPLETED: '완료',
  SHIPPING: '배송중',
  DELIVERED: '배송완료',
  ACTIVE: '활성',
  INACTIVE: '비활성',
  CANCELLED: '취소됨',
  EXPIRED: '만료됨'
};
