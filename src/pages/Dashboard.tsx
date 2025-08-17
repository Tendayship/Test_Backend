import React, { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  BookOpen,
  Plus,
  Clock,
  Send,
  Settings,
  LogOut,
  Home,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { FamilyGroup } from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { useFamilyData } from '../hooks/useFamilyData';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { PostForm } from '../components/PostForm';
import { PostList } from '../components/PostList';
import { FamilyMembers } from '../components/FamilyMembers';
import { IssueStatus } from '../components/IssueStatus';
import { apiService } from '../services/api';

interface DashboardProps {
  familyGroup: FamilyGroup | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ familyGroup: initialFamilyGroup }) => {
  const { user, handleLogout } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const {
    familyGroup,
    recipient,
    members,
    currentIssue,
    posts,
    loading,
    loadAllData,
    refreshPosts,
    refreshMembers,
    setCurrentIssue,
  } = useFamilyData();

  const [showPostForm, setShowPostForm] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'books'>('posts');

  useEffect(() => {
    loadAllData();
  }, []);

  const handlePostSuccess = () => {
    setShowPostForm(false);
    refreshPosts();
    showSuccess('소식이 성공적으로 등록되었습니다!');
  };

  const handleLogoutClick = () => {
    handleLogout();
    showSuccess('로그아웃되었습니다');
  };

  const calculateNextDeadline = (deadlineType: string): string => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const firstSunday = new Date(nextMonth);
    while (firstSunday.getDay() !== 0) {
      firstSunday.setDate(firstSunday.getDate() + 1);
    }
    
    if (deadlineType === 'SECOND_SUNDAY') {
      firstSunday.setDate(firstSunday.getDate() + 7);
    } else {
      firstSunday.setDate(firstSunday.getDate() + 21);
    }
    
    return firstSunday.toISOString().split('T')[0];
  };

  const handleCreateIssue = async () => {
    if (!familyGroup) {
      showError('가족 그룹 정보를 찾을 수 없습니다');
      return;
    }

    setIsCreatingIssue(true);
    try {
      const newIssue = await apiService.createIssue({
        group_id: familyGroup.id,
        issue_number: (currentIssue?.issue_number || 0) + 1,
        deadline_date: calculateNextDeadline(familyGroup.deadline_type),
        status: 'OPEN'
      });

      if (newIssue && newIssue.issue) {
        const newCurrentIssue = {
          id: newIssue.issue.id,
          group_id: familyGroup.id,
          issue_number: newIssue.issue.issue_number,
          deadline_date: newIssue.issue.deadline_date,
          status: 'OPEN' as const,
          days_until_deadline: Math.ceil((new Date(newIssue.issue.deadline_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          created_at: new Date().toISOString()
        };
        setCurrentIssue(newCurrentIssue);
      }

      showSuccess('새 회차가 생성되었습니다!');
      setShowCreateIssueModal(false);
      
      setTimeout(async () => {
        await loadAllData();
        
        setTimeout(() => {
          setShowPostForm(true);
          showInfo('이제 소식을 작성할 수 있습니다! 이미지와 함께 소식을 공유해보세요 📸');
        }, 800);
      }, 500);

    } catch (error) {
      console.error('회차 생성 실패:', error);
      showError('회차 생성에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsCreatingIssue(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const group = familyGroup || initialFamilyGroup;
  const canWritePost = currentIssue?.status === 'OPEN';
  const daysUntilDeadline = currentIssue?.days_until_deadline ?? 0;
  const isLeader = members.find(m => m.user_id === user?.id)?.role === 'LEADER';

  const getPostButtonState = () => {
    if (!currentIssue) return { 
      text: '회차를 먼저 생성하세요', 
      disabled: true, 
      variant: 'secondary' as const,
      icon: <AlertCircle className="w-4 h-4 mr-2" />
    };
    if (canWritePost) return { 
      text: '새 소식 작성', 
      disabled: false, 
      variant: 'primary' as const,
      icon: <MessageSquare className="w-4 h-4 mr-2" />
    };
    return { 
      text: '작성 기간 종료', 
      disabled: true, 
      variant: 'secondary' as const,
      icon: <Clock className="w-4 h-4 mr-2" />
    };
  };

  const buttonState = getPostButtonState();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Home className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                {group?.group_name || '가족 소식'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogoutClick}
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader title="현재 회차" />
              <div className="p-4">
                {currentIssue ? (
                  <IssueStatus
                    issue={currentIssue}
                    onRefresh={() => loadAllData()}
                  />
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">진행 중인 회차가 없습니다</p>
                    {isLeader && (
                      <Button
                        size="sm"
                        onClick={() => setShowCreateIssueModal(true)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        첫 회차 생성
                      </Button>
                    )}
                    {!isLeader && (
                      <p className="text-sm text-gray-500">
                        그룹 리더가 회차를 생성할 때까지 기다려주세요
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {recipient && (
              <Card>
                <CardHeader title="받는 분" />
                <div className="p-4 space-y-2">
                  <p className="font-medium text-gray-900">{recipient.name}</p>
                  <p className="text-sm text-gray-600">{recipient.address}</p>
                  {recipient.address_detail && (
                    <p className="text-sm text-gray-600">{recipient.address_detail}</p>
                  )}
                  {recipient.phone && (
                    <p className="text-sm text-gray-600">{recipient.phone}</p>
                  )}
                </div>
              </Card>
            )}

            <Card>
              <CardHeader title="빠른 작업" />
              <div className="p-4 space-y-3">
                <Button
                  onClick={() => setShowPostForm(true)}
                  disabled={buttonState.disabled}
                  className="w-full"
                  variant={buttonState.variant}
                >
                  {buttonState.icon}
                  {buttonState.text}
                </Button>
                
                <Button
                  onClick={() => setShowMembers(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Users className="w-4 h-4 mr-2" />
                  가족 구성원 ({members.length}명)
                </Button>
                
                {isLeader && (
                  <Button
                    onClick={() => setShowCreateIssueModal(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    새 회차 생성
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'posts'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  소식 ({posts.length})
                </button>
                <button
                  onClick={() => setActiveTab('books')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'books'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  책자 목록
                </button>
              </nav>
            </div>

            {activeTab === 'posts' && (
              <div className="space-y-6">
                {canWritePost && daysUntilDeadline <= 7 && daysUntilDeadline > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-orange-600 mr-2" />
                      <span className="text-orange-800 font-medium">
                        ⚠️ {daysUntilDeadline}일 후 소식 작성이 마감됩니다
                      </span>
                    </div>
                  </div>
                )}

                {!currentIssue && (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      아직 시작된 회차가 없습니다
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {isLeader 
                        ? '첫 번째 회차를 생성하여 가족 소식 공유를 시작해보세요!'
                        : '그룹 리더가 회차를 생성할 때까지 기다려주세요.'
                      }
                    </p>
                    {isLeader && (
                      <Button
                        onClick={() => setShowCreateIssueModal(true)}
                        size="lg"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        첫 번째 회차 생성하기
                      </Button>
                    )}
                  </div>
                )}

                {currentIssue && (
                  <PostList 
                    posts={posts} 
                    onPostUpdated={refreshPosts}
                    currentUser={user}
                  />
                )}
              </div>
            )}

            {activeTab === 'books' && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  아직 제작된 책자가 없습니다
                </h3>
                <p className="text-gray-600">
                  첫 번째 회차가 마감되면 자동으로 책자가 제작됩니다
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPostForm}
        onClose={() => setShowPostForm(false)}
        title="새 소식 작성"
        size="lg"
      >
        <PostForm
          onSuccess={handlePostSuccess}
          onCancel={() => setShowPostForm(false)}
        />
      </Modal>

      <Modal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        title="가족 구성원"
        size="md"
      >
        <FamilyMembers 
          members={members} 
          onMembersUpdated={refreshMembers}
          currentUser={user}
          familyGroup={group}
        />
      </Modal>

      <Modal
        isOpen={showCreateIssueModal}
        onClose={() => setShowCreateIssueModal(false)}
        title="새 회차 생성"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-blue-800 font-medium mb-2">새 회차 정보</h4>
                <div className="space-y-1 text-blue-700 text-sm">
                  <p>• 회차 번호: {(currentIssue?.issue_number || 0) + 1}회차</p>
                  {familyGroup && (
                    <p>• 마감일: {new Date(calculateNextDeadline(familyGroup.deadline_type)).toLocaleDateString()}</p>
                  )}
                  <p>• 최대 소식: 20개</p>
                  <p>• 소식 길이: 50-100자 + 이미지 1-4장</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-gray-600">
            <p className="mb-3">새로운 회차를 생성하시겠습니까?</p>
            <p className="text-sm text-gray-500">
              회차가 생성되면 가족 구성원들이 소식을 작성할 수 있습니다. 
              마감일이 지나면 자동으로 책자가 제작됩니다.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCreateIssueModal(false)}
              disabled={isCreatingIssue}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateIssue}
              disabled={isCreatingIssue}
            >
              {isCreatingIssue ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  생성 중...
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  회차 생성하기
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
