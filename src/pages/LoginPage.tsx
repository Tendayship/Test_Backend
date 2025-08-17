import React from 'react';
import { Home, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

export const LoginPage: React.FC = () => {
  const { handleKakaoLogin, loading } = useAuth();
  const { showError } = useNotification();

  const handleLogin = async () => {
    try {
      await handleKakaoLogin();
    } catch (error) {
      showError('카카오 로그인에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
        
        <div className="relative text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">가족 소식 서비스</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
            <Heart className="w-4 h-4 text-red-400" />
            <span>매달 전하는 따뜻한 가족 이야기</span>
            <Heart className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-sm text-gray-500">
            가족의 일상을 나누고 추억을 만들어보세요
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={handleLogin}
            loading={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            size="lg"
          >
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJDMiAxNy41MjMgNi40NzcgMjIgMTIgMjJDMTcuNTIzIDIyIDIyIDE3LjUyMyAyMiAxMkMyMiA2LjQ3NyAxNy41MjMgMiAxMiAyWiIgZmlsbD0iIzM4MUZFOCIvPgo8L3N2Zz4K" 
              alt="Kakao" 
              className="w-6 h-6" 
            />
            카카오로 시작하기
          </Button>
          
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>간편하게 카카오 계정으로 시작하세요</p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <span>• 가족 그룹 생성</span>
              <span>• 소식 공유</span>
              <span>• 책자 제작</span>
            </div>
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <p className="text-xs text-gray-600">가족 연결</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                </svg>
              </div>
              <p className="text-xs text-gray-600">소식 공유</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h2a2 2 0 002-2V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/>
                </svg>
              </div>
              <p className="text-xs text-gray-600">책자 제작</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};