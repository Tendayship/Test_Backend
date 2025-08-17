import { useState, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadUserInfo();
    }
  }, [token]);

  // localStorage 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      if (newToken !== token) {
        setToken(newToken);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      const { login_url } = await apiService.getKakaoLoginUrl();
      
      // 팝업 윈도우로 카카오 로그인
      const popup = window.open(
        login_url,
        'kakao-login',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // 팝업에서 메시지 받기
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'KAKAO_LOGIN_SUCCESS') {
          popup?.close();
          const { code } = event.data;
          handleKakaoCallback(code);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      throw error;
    }
  };

  const handleKakaoCallback = async (code: string) => {
    try {
      setLoading(true);
      const loginData = await apiService.kakaoLogin(code);
      
      localStorage.setItem('token', loginData.access_token);
      setToken(loginData.access_token);
      setUser(loginData.user);
      
      return loginData;
    } catch (error) {
      console.error('카카오 콜백 처리 실패:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return {
    user,
    token,
    loading,
    handleKakaoLogin,
    handleKakaoCallback,
    handleLogout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };
};