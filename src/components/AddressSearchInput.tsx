import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { addressService } from '../services/addressService';
import { Button } from './ui/Button';
import { AddressData, AddressSearchResult } from '../types';
import { useNotification } from '../hooks/useNotification';

interface AddressSearchInputProps {
  onAddressSelect: (address: AddressData) => void;
  initialValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  label?: string;
}

export const AddressSearchInput: React.FC<AddressSearchInputProps> = ({
  onAddressSelect,
  initialValue = '',
  placeholder = '주소를 검색하세요',
  error,
  required = false,
  label = '주소',
}) => {
  const [query, setQuery] = useState<string>(initialValue);
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const { showError } = useNotification();

  // 🔧 개선된 디바운스 검색 함수 - 검색 전략 포함
  const debouncedSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 주소 검색 시작:', searchQuery);
      
      // 🔧 검색 전략: 구체적인 주소는 그대로, 일반 지역명은 더 넓게
      let searchResults = await addressService.searchAddress(searchQuery);
      
      // 🔧 결과가 1개 미만이고 검색어가 길면 키워드 축약 시도
      if (searchResults.length <= 1 && searchQuery.includes(' ')) {
        const shorterQuery = searchQuery.split(' ').slice(0, -1).join(' ');
        if (shorterQuery.length >= 2) {
          console.log('🔄 검색 범위 확장 시도:', shorterQuery);
          const expandedResults = await addressService.searchAddress(shorterQuery);
          
          // 더 많은 결과가 나오면 사용
          if (expandedResults.length > searchResults.length) {
            searchResults = expandedResults;
            console.log('✅ 확장 검색으로 더 많은 결과 획득:', expandedResults.length, '건');
          }
        }
      }
      
      console.log('✅ 주소 검색 결과:', searchResults.length, '건');
      console.log('📋 검색 결과 상세:', searchResults);
      
      setResults(searchResults);
      setShowResults(searchResults.length > 0);
      
      console.log('🎯 showResults 상태:', searchResults.length > 0);
      
    } catch (error) {
      console.error('❌ 주소 검색 오류:', error);
      setResults([]);
      setShowResults(false);
      showError('주소 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  }, [showError]);

  // 입력값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedAddress('');

    // 기존 디바운스 타이머 클리어
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 새로운 디바운스 타이머 설정
    debounceRef.current = setTimeout(() => {
      debouncedSearch(value);
    }, 300);
  };

  // 🔧 주소 선택 처리 - 개선된 버전
  const handleAddressSelect = (address: AddressSearchResult) => {
    console.log('📍 주소 선택됨:', address);
    
    // 더 안전한 주소 데이터 처리
    const displayAddress = address.road_address?.address_name || address.address_name || '주소 정보 없음';
    
    const addressData: AddressData = {
      fullAddress: displayAddress,
      roadAddress: address.road_address?.address_name,
      jibunAddress: address.address_name,
      postalCode: address.road_address?.zone_no || '',
      region1: address.region_1depth_name || '',
      region2: address.region_2depth_name || '',
      region3: address.region_3depth_name || '',
      coordinates: {
        latitude: parseFloat(address.y) || 0,
        longitude: parseFloat(address.x) || 0,
      },
      addressType: address.road_address ? 'ROAD' : 'JIBUN',
    };

    setQuery(displayAddress);
    setSelectedAddress(displayAddress);
    setShowResults(false);
    setResults([]);

    console.log('✅ 주소 데이터 전달:', addressData);
    onAddressSelect(addressData);
  };

  // 🔧 현재 위치로 주소 찾기 - 강화된 버전
  const handleCurrentLocation = () => {
    console.log('🎯 현재 위치 버튼 클릭됨');
    
    if (!navigator.geolocation) {
      console.error('❌ 지오로케이션 미지원');
      showError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    // API 키 사전 확인
    if (!process.env.REACT_APP_KAKAO_REST_API_KEY) {
      console.error('❌ Kakao API Key 누락');
      showError('주소 검색 서비스가 설정되지 않았습니다. 관리자에게 문의하세요.');
      return;
    }

    setIsSearching(true);
    console.log('🔄 위치 정보 요청 시작...');

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15초 타임아웃
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('✅ 위치 정보 획득 성공:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });

        try {
          const results = await addressService.getAddressByCoordinates(
            position.coords.longitude,
            position.coords.latitude
          );

          console.log('🏠 주소 변환 결과:', results);

          if (results && results.length > 0) {
            console.log('✅ 주소 변환 성공, 선택 처리 중...');
            handleAddressSelect(results[0]);
          } else {
            console.warn('⚠️ 주소 결과 없음');
            showError('현재 위치의 주소를 찾을 수 없습니다. 다시 시도해 주세요.');
          }
        } catch (error) {
          console.error('❌ 주소 변환 실패:', error);
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          showError(`주소 변환 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
          setIsSearching(false);
        }
      },
      (error) => {
        console.error('❌ 지오로케이션 오류:', {
          code: error.code,
          message: error.message
        });

        let errorMessage = '';
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 허용을 체크해주세요.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = '현재 위치를 확인할 수 없습니다. 네트워크를 확인하고 다시 시도해주세요.';
            break;
          case 3: // TIMEOUT
            errorMessage = '위치 확인이 시간초과되었습니다. 다시 시도해주세요.';
            break;
          default:
            errorMessage = `위치 오류: ${error.message}`;
        }

        showError(errorMessage);
        setIsSearching(false);
      },
      options
    );
  };

  // 외부 클릭 시 결과 숨기기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 컴포넌트 언마운트 시 디바운스 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            className={`w-full pl-10 pr-20 py-3 border rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
              error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
          />

          <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />

          <div className="absolute right-2 top-2 flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCurrentLocation}
              disabled={isSearching}
              className="px-2 py-1"
              title="현재 위치로 주소 찾기"
            >
              <MapPin className="w-3 h-3" />
            </Button>

            {query && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setSelectedAddress('');
                  setResults([]);
                  setShowResults(false);
                }}
                className="px-2 py-1"
                title="입력 내용 지우기"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* 🔧 검색 결과 드롭다운 - 개선된 버전 */}
        {showResults && (
          <div
            ref={resultsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {isSearching ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mx-auto mb-2"></div>
                검색 중...
              </div>
            ) : results.length > 0 ? (
              results.map((address, index) => {
                // 🔧 주소 표시 로직 개선
                const displayAddress = address.road_address?.address_name || address.address_name;
                const hasRoadAddress = !!address.road_address;
                
                return (
                  <div
                    key={index}
                    onClick={() => handleAddressSelect(address)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                  >
                    {/* 메인 주소 표시 */}
                    <div className="font-medium text-gray-900">
                      {displayAddress}
                    </div>
                    
                    {/* 지번 주소가 다른 경우에만 표시 */}
                    {hasRoadAddress && address.address_name !== displayAddress && (
                      <div className="text-sm text-gray-500 mt-1">
                        지번: {address.address_name}
                      </div>
                    )}
                    
                    {/* 우편번호가 있는 경우만 표시 */}
                    {address.road_address?.zone_no && (
                      <div className="text-xs text-blue-600 mt-1">
                        우편번호: {address.road_address.zone_no}
                      </div>
                    )}
                    
                    {/* 🔧 지역 타입인 경우 추가 정보 표시 - 수정된 버전 */}
                    {!address.road_address && address.region_1depth_name && (
                      <div className="text-xs text-green-600 mt-1">
                        📍 {address.region_1depth_name} {address.region_2depth_name} {address.region_3depth_name} 지역
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {selectedAddress && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          ✅ 선택된 주소: {selectedAddress}
        </div>
      )}
    </div>
  );
};
