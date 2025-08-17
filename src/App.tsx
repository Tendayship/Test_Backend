import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { FamilySetupPage } from './pages/FamilySetupPage';
import { Dashboard } from './pages/Dashboard';
import { NotificationContainer } from './components/ui/NotificationContainer';
import { LoadingPage } from './components/ui/LoadingSpinner';
import { useAuth } from './hooks/useAuth';
import { useFamilyData } from './hooks/useFamilyData';
import { FamilyGroup } from './types';

const App: React.FC = () => {
  const { user, token, handleKakaoCallback, loading: authLoading } = useAuth();
  const { familyGroup, loadFamilyGroup, loading: familyLoading } = useFamilyData();
  const [initialLoading, setInitialLoading] = useState(true);

  // URL 파라미터 처리 (카카오 로그인 콜백)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('user_id');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('카카오 로그인 오류:', error);
      window.history.replaceState({}, document.title, '/');
      return;
    }
    
    if (token && userId) {
      // Backend에서 이미 처리된 토큰을 직접 저장
      localStorage.setItem('token', token);
      // URL 정리
      window.history.replaceState({}, document.title, '/');
      // useAuth 훅의 토큰 상태를 직접 업데이트하여 리로드 없이 진행
      window.dispatchEvent(new Event('storage'));
    }
  }, []);

  // 가족 그룹 정보 로드
  useEffect(() => {
    const loadInitialData = async () => {
      if (user && token) {
        try {
          await loadFamilyGroup();
        } catch (error) {
          console.log('가족 그룹 없음 - 설정 페이지로 이동');
        }
      }
      setInitialLoading(false);
    };

    if (!authLoading) {
      loadInitialData();
    }
  }, [user, token, authLoading, loadFamilyGroup]);

  const handleSetupComplete = async () => {
    try {
      await loadFamilyGroup();
    } catch (error) {
      console.error('가족 그룹 로드 실패:', error);
    }
  };

  // 초기 로딩 중
  if (authLoading || initialLoading) {
    return <LoadingPage message="로딩 중..." />;
  }

  // 가족 그룹 로딩 중 (이미 로그인된 상태)
  if (token && user && familyLoading) {
    return <LoadingPage message="가족 정보를 불러오는 중..." />;
  }

  // 로그인되지 않은 경우
  if (!token || !user) {
    return (
      <>
        <LoginPage />
        <NotificationContainer />
      </>
    );
  }

  // 사용자는 있지만 가족 그룹이 없는 경우
  if (!familyGroup) {
    return (
      <>
        <FamilySetupPage onSetupComplete={handleSetupComplete} />
        <NotificationContainer />
      </>
    );
  }

  // 모든 설정이 완료된 경우
  return (
    <>
      <Dashboard familyGroup={familyGroup} />
      <NotificationContainer />
    </>
  );
};

export default App;