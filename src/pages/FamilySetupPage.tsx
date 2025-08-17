import React, { useState } from 'react';
import { Users, Calendar } from 'lucide-react';
import {
  FamilySetupData,
  DEADLINE_TYPE_LABELS,
  RELATIONSHIP_LABELS,
  AddressData,
} from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { AddressSearchInput } from '../components/AddressSearchInput';
import { apiService } from '../services/api';
import { useNotification } from '../hooks/useNotification';

interface FamilySetupPageProps {
  onSetupComplete: () => void;
}

export const FamilySetupPage: React.FC<FamilySetupPageProps> = ({ onSetupComplete }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [setupData, setSetupData] = useState<FamilySetupData>({
    group_name: '',
    deadline_type: 'SECOND_SUNDAY',
    leader_relationship: 'SON',
    recipient_name: '',
    recipient_address: '',
    recipient_address_detail: '',
    recipient_postal_code: '',
    recipient_phone: '',
    // 확장된 주소 필드
    recipient_road_address: '',
    recipient_jibun_address: '',
    recipient_address_type: '',
    recipient_latitude: undefined,
    recipient_longitude: undefined,
    recipient_region_1depth: '',
    recipient_region_2depth: '',
    recipient_region_3depth: '',
  });

  const { showSuccess, showError } = useNotification();

  const handleInputChange = (field: keyof FamilySetupData, value: string) => {
    setSetupData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressSelect = (address: AddressData) => {
    setAddressData(address);
    setSetupData((prev) => ({
      ...prev,
      recipient_address: address.roadAddress || address.jibunAddress,
      recipient_postal_code: address.postalCode || '',
      recipient_road_address: address.roadAddress || '',
      recipient_jibun_address: address.jibunAddress,
      recipient_address_type: address.addressType || '',
      recipient_latitude: address.coordinates?.latitude,
      recipient_longitude: address.coordinates?.longitude,
      recipient_region_1depth: address.region1,
      recipient_region_2depth: address.region2,
      recipient_region_3depth: address.region3,
    }));
  };

  // 🔧 validateStep1 강화 - leader_relationship 검증 추가
  const validateStep1 = () => {
    if (!setupData.group_name.trim()) {
      showError('가족 그룹명을 입력해 주세요');
      return false;
    }

    if (!setupData.leader_relationship) {
      showError('받는 분과의 관계를 선택해 주세요');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!setupData.recipient_name.trim()) {
      showError('받는 분 성함을 입력해 주세요');
      return false;
    }

    if (!setupData.recipient_address.trim()) {
      showError('주소를 입력해 주세요');
      return false;
    }

    if (!addressData) {
      showError('주소를 선택해 주세요');
      return false;
    }

    // 🔧 추가 유효성 검증
    if (setupData.recipient_postal_code && !/^\d{5}$/.test(setupData.recipient_postal_code)) {
      showError('우편번호는 5자리 숫자여야 합니다');
      return false;
    }

    if (setupData.recipient_phone && !/^[\d-\s()]+$/.test(setupData.recipient_phone)) {
      showError('전화번호 형식이 올바르지 않습니다');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // 🔧 handleSubmit 함수 - leader_relationship 필드 복원
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // 🔧 undefined 제거 헬퍼 함수
      const removeUndefinedFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
        return Object.fromEntries(
          Object.entries(obj).filter(([_, v]) => v !== undefined)
        ) as Partial<T>;
      };

      // 🔧 데이터 정제 및 타입 보장
      const requestData = {
        // 필수 문자열 필드
        group_name: setupData.group_name.trim(),
        deadline_type: setupData.deadline_type,
        leader_relationship: setupData.leader_relationship, // 🔧 필수 필드 복원
        recipient_name: setupData.recipient_name.trim(),
        recipient_address: setupData.recipient_address.trim(),
        
        // 선택적 문자열 필드
        recipient_address_detail: setupData.recipient_address_detail?.trim(),
        recipient_postal_code: setupData.recipient_postal_code?.trim(),
        recipient_phone: setupData.recipient_phone?.trim(),
        recipient_road_address: setupData.recipient_road_address?.trim(),
        recipient_jibun_address: setupData.recipient_jibun_address?.trim(),
        recipient_address_type: setupData.recipient_address_type?.trim(),
        recipient_region_1depth: setupData.recipient_region_1depth?.trim(),
        recipient_region_2depth: setupData.recipient_region_2depth?.trim(),
        recipient_region_3depth: setupData.recipient_region_3depth?.trim(),
        
        // 숫자 필드
        recipient_latitude: setupData.recipient_latitude ? Number(setupData.recipient_latitude) : undefined,
        recipient_longitude: setupData.recipient_longitude ? Number(setupData.recipient_longitude) : undefined,
      };

      // 🔧 undefined 필드 안전하게 제거
      const cleanedData = removeUndefinedFields(requestData);
      
      console.log('📤 최종 전송 데이터:', cleanedData);

      await apiService.createFamilyGroup(cleanedData);
      
      showSuccess('가족 그룹이 성공적으로 생성되었습니다!');
      onSetupComplete();
    } catch (error) {
      console.error('가족 그룹 생성 실패:', error);
      showError(
        error instanceof Error ? error.message : '그룹 생성에 실패했습니다. 입력 정보를 확인해 주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        {/* CardHeader는 title(필수) 기반이며 children을 받지 않는 타입으로 가정 */}
        <CardHeader
          title="가족 그룹 만들기"
          subtitle="소중한 가족과 함께하는 소식지 서비스"
        />

        {/* 진행 단계 표시 (CardHeader 아래 별도 블록) */}
        <div className="px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                1
              </div>
              <div className={`w-20 h-1 mx-2 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`} />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
            </div>
            <p className="text-sm text-gray-600 ml-4">
              {step === 1 ? '그룹 정보 입력' : '받는 분 정보 입력'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <Input
                label="가족 그룹명"
                type="text"
                value={setupData.group_name}
                onChange={(e) => handleInputChange('group_name', e.target.value)}
                placeholder="예: 김가네 가족"
                leftIcon={<Users />}
                required
              />

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  매월 마감일
                </label>
                <div className="space-y-3">
                  {Object.entries(DEADLINE_TYPE_LABELS).map(([value, label]) => (
                    <div key={value} className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id={value}
                        name="deadline_type"
                        value={value}
                        checked={setupData.deadline_type === value}
                        onChange={(e) => handleInputChange('deadline_type', e.target.value)}
                        className="mr-3 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <label
                          htmlFor={value}
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {label}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {value === 'SECOND_SUNDAY'
                            ? '매월 두 번째 일요일까지 소식 작성'
                            : '매월 네 번째 일요일까지 소식 작성'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 🔧 관계 선택 부분 복원 (필수!) */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">나와 받는 분의 관계</label>
                <select
                  value={setupData.leader_relationship}
                  onChange={(e) => handleInputChange('leader_relationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  {Object.entries(RELATIONSHIP_LABELS).slice(0, 4).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="button" onClick={handleNext}>
                  다음 단계
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <Input
                label="받는 분 성함"
                type="text"
                value={setupData.recipient_name}
                onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                placeholder="예: 김할머니"
                required
              />

              <AddressSearchInput
                onAddressSelect={handleAddressSelect}
                placeholder="주소를 검색하거나 현재 위치를 사용하세요"
                required
                error={!addressData && loading ? '주소를 선택해 주세요' : undefined}
              />

              <Input
                label="상세주소 (선택)"
                type="text"
                value={setupData.recipient_address_detail}
                onChange={(e) => handleInputChange('recipient_address_detail', e.target.value)}
                placeholder="예: 101동 505호"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="우편번호"
                  type="text"
                  value={setupData.recipient_postal_code}
                  onChange={(e) => handleInputChange('recipient_postal_code', e.target.value)}
                  placeholder="12345"
                  readOnly
                  className="bg-gray-50"
                />

                <Input
                  label="전화번호 (선택)"
                  type="tel"
                  value={setupData.recipient_phone}
                  onChange={(e) => handleInputChange('recipient_phone', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={handleBack}>
                  이전 단계
                </Button>

                <Button type="submit" loading={loading} disabled={!addressData}>
                  가족 그룹 만들기
                </Button>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};
