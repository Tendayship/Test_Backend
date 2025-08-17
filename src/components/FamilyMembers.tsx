import React, { useState } from 'react';
import { Users, Copy, UserPlus, Crown, Trash2 } from 'lucide-react';
import { FamilyMember, User, FamilyGroup, RELATIONSHIP_LABELS } from '../types';
import { Card, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { apiService } from '../services/api';
import { useNotification } from '../hooks/useNotification';

interface FamilyMembersProps {
  members: FamilyMember[];
  currentUser: User | null;
  familyGroup: FamilyGroup | null;
  onMembersUpdated: () => void;
}

export const FamilyMembers: React.FC<FamilyMembersProps> = ({
  members,
  currentUser,
  familyGroup,
  onMembersUpdated,
}) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteCode, setInviteCode] = useState(familyGroup?.invite_code || '');
  const { showSuccess, showError } = useNotification();

  const currentMember = members.find(m => m.user_id === currentUser?.id);
  const isLeader = currentMember?.role === 'LEADER';

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      showSuccess('초대 코드가 복사되었습니다');
    } catch (error) {
      showError('초대 코드 복사에 실패했습니다');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isLeader) {
      showError('그룹 리더만 구성원을 삭제할 수 있습니다');
      return;
    }

    try {
      await apiService.removeFamilyMember(memberId);
      showSuccess('구성원이 제거되었습니다');
      onMembersUpdated();
    } catch (error) {
      showError(error instanceof Error ? error.message : '구성원 제거에 실패했습니다');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 초대 코드 섹션 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          가족 초대하기
        </h4>
        <div className="flex gap-2">
          <Input
            value={inviteCode}
            readOnly
            className="font-mono text-sm"
            placeholder="초대 코드"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={copyInviteCode}
          >
            <Copy className="w-4 h-4 mr-2" />
            복사
          </Button>
        </div>
        <p className="text-sm text-blue-700 mt-2">
          이 코드를 가족에게 공유하여 그룹에 초대하세요
        </p>
      </div>

      {/* 구성원 목록 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4" />
            구성원 ({members.length}명)
          </h4>
        </div>

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  {member.role === 'LEADER' ? (
                    <Crown className="w-5 h-5 text-primary-600" />
                  ) : (
                    <Users className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {member.user?.name || '사용자'}
                    </p>
                    {member.role === 'LEADER' && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                        리더
                      </span>
                    )}
                    {member.user_id === currentUser?.id && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        나
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {RELATIONSHIP_LABELS[member.relationship] || member.relationship}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(member.joined_at).toLocaleDateString('ko-KR')} 참여
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {member.user?.email && (
                  <span className="text-xs text-gray-500 max-w-32 truncate">
                    {member.user.email}
                  </span>
                )}
                
                {isLeader && member.role !== 'LEADER' && member.user_id !== currentUser?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 안내 사항 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">알아두세요</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 한 그룹에는 최대 8명까지 참여할 수 있습니다</li>
          <li>• 그룹 리더는 구성원을 관리할 수 있습니다</li>
          <li>• 모든 구성원이 소식을 작성하고 볼 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
};