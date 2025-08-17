import React, { useState } from 'react';
import { MessageSquare, Heart, MoreHorizontal, Edit, Trash2, User } from 'lucide-react';
import { Post, User as UserType } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { apiService } from '../services/api';
import { useNotification } from '../hooks/useNotification';

interface PostListProps {
  posts: Post[];
  currentUser: UserType | null;
  onPostUpdated: () => void;
}

interface PostItemProps {
  post: Post;
  currentUser: UserType | null;
  onPostUpdated: () => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, currentUser, onPostUpdated }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const isAuthor = currentUser?.id === post.author_id;
  const authorName = post.author_name || post.author?.name || '익명';

  const handleDelete = async () => {
    setLoading(true);
    try {
      await apiService.deletePost(post.id);
      showSuccess('소식이 삭제되었습니다');
      onPostUpdated();
      setShowDeleteConfirm(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : '소식 삭제에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  return (
    <>
      <Card hover className="relative">
        {/* 게시글 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{authorName}</p>
              <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
            </div>
          </div>

          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-32">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 게시글 내용 */}
        <div className="mb-4">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* 이미지 갤러리 */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className={`grid gap-2 mb-4 ${
            post.image_urls.length === 1 ? 'grid-cols-1' :
            post.image_urls.length === 2 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}>
            {post.image_urls.slice(0, 4).map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`소식 이미지 ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyVjdBMiAyIDAgMCAwIDE5IDVINUEyIDIgMCAwIDAgMyA3VjE3QTIgMiAwIDAgMCA1IDE5SDE0IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjkiIGN5PSI5IiByPSIyIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Im0yMSAxNS0zLjA4Ni0zLjA4NmEyIDIgMCAwIDAtMi44MjggMEw2IDIxIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==';
                  }}
                />
                {post.image_urls.length > 4 && index === 3 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white font-medium">
                      +{post.image_urls.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 게시글 푸터 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-sm">좋아요</span>
            </button>
            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">댓글</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="소식 삭제"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            정말로 이 소식을 삭제하시겠습니까? 삭제된 소식은 복구할 수 없습니다.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={loading}
            >
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const PostList: React.FC<PostListProps> = ({ posts, currentUser, onPostUpdated }) => {
  if (posts.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">아직 소식이 없어요</h3>
          <p className="text-gray-500 mb-4">
            가족에게 전할 첫 번째 소식을 작성해보세요
          </p>
        </div>
      </Card>
    );
  }

  // 최신순으로 정렬
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedPosts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          currentUser={currentUser}
          onPostUpdated={onPostUpdated}
        />
      ))}
    </div>
  );
};