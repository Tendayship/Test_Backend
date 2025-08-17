import { AddressSearchResult, KakaoAddressResponse } from '../types';

export class AddressService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://dapi.kakao.com/v2/local/search/address.json';

  constructor() {
    this.apiKey = process.env.REACT_APP_KAKAO_REST_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Kakao API Key가 설정되지 않았습니다. 주소 검색 기능이 제한됩니다.');
      console.warn('🔧 REACT_APP_KAKAO_REST_API_KEY 환경변수를 확인하세요.');
    } else {
      console.log('✅ Kakao API Key 설정됨');
    }
  }

  // 🔧 개선된 주소 검색 - 더 많은 결과 반환
  async searchAddress(query: string): Promise<AddressSearchResult[]> {
    if (!query.trim()) {
      console.log('🚫 검색어가 비어있음');
      return [];
    }
    
    if (!this.apiKey) {
      console.error('❌ Kakao API Key 누락으로 주소 검색 불가');
      throw new Error('Kakao API 키가 설정되지 않았습니다');
    }

    const cleanQuery = query.trim();
    console.log('🔍 주소 검색 요청:', { query: cleanQuery, apiKeyLength: this.apiKey.length });

    try {
      // 🔧 중요: analyze_type은 반드시 소문자 'similar' 사용
      const params = new URLSearchParams({
        query: cleanQuery,
        analyze_type: 'similar',  // ✅ 소문자로 수정
        page: '1',
        size: '15',
        sort: 'accuracy'
      });

      const url = `${this.baseUrl}?${params.toString()}`;
      console.log('📡 API 요청 URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `KakaoAK ${this.apiKey}`,
        },
      });

      console.log('📊 API 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '응답 읽기 실패');
        console.error('❌ Kakao API 오류 응답:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 401) {
          throw new Error('Kakao API 인증 실패. API 키를 확인하세요.');
        } else if (response.status === 403) {
          throw new Error('Kakao API 권한 없음. 도메인 설정을 확인하세요.');
        } else {
          throw new Error(`Kakao API 오류 (${response.status}): ${errorText}`);
        }
      }

      const data: KakaoAddressResponse = await response.json();
      console.log('✅ 주소 검색 성공:', {
        totalCount: data.meta.total_count,
        resultCount: data.documents.length,
        isEnd: data.meta.is_end,
        searchQuery: cleanQuery
      });

      // 🔧 결과 상세 로깅 (개발용)
      console.log('📋 검색 결과 미리보기:', 
        data.documents.slice(0, 5).map(doc => ({
          address: doc.address_name,
          roadAddress: doc.road_address?.address_name,
          region: `${doc.region_1depth_name} ${doc.region_2depth_name} ${doc.region_3depth_name}`.trim()
        }))
      );

      return data.documents;
    } catch (error) {
      console.error('❌ 주소 검색 실패:', error);
      throw error;
    }
  }

  // 좌표로 주소 검색 (역지오코딩) - 기존과 동일
  async getAddressByCoordinates(longitude: number, latitude: number): Promise<AddressSearchResult[]> {
    if (!this.apiKey) {
      console.error('❌ Kakao API Key 누락으로 좌표→주소 변환 불가');
      throw new Error('Kakao API 키가 설정되지 않았습니다');
    }

    console.log('🌍 좌표→주소 변환 시도:', { longitude, latitude });

    try {
      const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`;
      console.log('📡 역지오코딩 API 요청:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `KakaoAK ${this.apiKey}`,
        },
      });

      console.log('📊 역지오코딩 API 응답:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '응답 읽기 실패');
        console.error('❌ Kakao 역지오코딩 API 오류:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        if (response.status === 401) {
          throw new Error('Kakao API 인증 실패. API 키를 확인하세요.');
        } else if (response.status === 403) {
          throw new Error('Kakao API 권한 없음. 도메인 설정을 확인하세요.');
        } else {
          throw new Error(`Kakao 역지오코딩 API 오류 (${response.status}): ${errorText}`);
        }
      }

      const data: KakaoAddressResponse = await response.json();
      console.log('✅ 좌표→주소 변환 성공:', {
        totalCount: data.meta.total_count,
        resultCount: data.documents.length,
        addresses: data.documents.map(doc => doc.address_name)
      });

      return data.documents;
    } catch (error) {
      console.error('❌ 좌표→주소 변환 실패:', error);
      throw error;
    }
  }
}

export const addressService = new AddressService();
