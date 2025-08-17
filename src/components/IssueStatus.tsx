import React from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Issue, STATUS_LABELS } from '../types';
import { Card, CardHeader } from './ui/Card';
import { Button } from './ui/Button';

interface IssueStatusProps {
  issue: Issue | null;
  onRefresh: () => void;
}

export const IssueStatus: React.FC<IssueStatusProps> = ({ issue, onRefresh }) => {
  if (!issue) {
    return (
      <Card>
        <CardHeader title="현재 회차" />
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">진행 중인 회차가 없습니다</p>
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-green-600 bg-green-100';
      case 'CLOSED':
        return 'text-yellow-600 bg-yellow-100';
      case 'PUBLISHED':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="w-4 h-4" />;
      case 'CLOSED':
        return <AlertCircle className="w-4 h-4" />;
      case 'PUBLISHED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const getDaysUntilDeadline = () => {
    if (!issue.deadline_date) return null;
    
    const deadline = new Date(issue.deadline_date);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysLeft = getDaysUntilDeadline();

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardHeader title={`${issue.issue_number}회차`} />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* 상태 표시 */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
            {getStatusIcon(issue.status)}
            {STATUS_LABELS[issue.status] || issue.status}
          </span>
        </div>

        {/* 마감일 정보 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>마감일: {formatDate(issue.deadline_date)}</span>
          </div>

          {/* 남은 일수 */}
          {issue.status === 'OPEN' && daysLeft !== null && (
            <div className={`flex items-center gap-2 text-sm ${
              daysLeft <= 3 ? 'text-red-600' :
              daysLeft <= 7 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span>
                {daysLeft > 0 ? `${daysLeft}일 남음` :
                 daysLeft === 0 ? '오늘 마감!' : '마감됨'}
              </span>
            </div>
          )}
        </div>

        {/* 생성/마감/발행 시간 */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
          <div>생성: {formatDate(issue.created_at)}</div>
          {issue.closed_at && (
            <div>마감: {formatDate(issue.closed_at)}</div>
          )}
          {issue.published_at && (
            <div>발행: {formatDate(issue.published_at)}</div>
          )}
        </div>

        {/* 상태별 안내 메시지 */}
        {issue.status === 'OPEN' && daysLeft !== null && daysLeft <= 7 && (
          <div className={`p-3 rounded-lg text-sm ${
            daysLeft <= 3 ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {daysLeft <= 3 ? '⚠️ 마감이 임박했습니다!' : '📝 소식 작성을 서둘러주세요'}
          </div>
        )}

        {issue.status === 'CLOSED' && (
          <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm">
            📚 책자 제작 중입니다
          </div>
        )}

        {issue.status === 'PUBLISHED' && (
          <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">
            ✅ 책자가 완성되어 배송 중입니다
          </div>
        )}
      </div>
    </Card>
  );
};