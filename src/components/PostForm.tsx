import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { useNotification } from '../hooks/useNotification';

interface PostFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PostForm: React.FC<PostFormProps> = ({ onSuccess, onCancel }) => {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showError, showSuccess } = useNotification();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 4) {
      showError('최대 4장까지만 선택할 수 있습니다.');
      return;
    }

    if (files.some(file => file.size > 10 * 1024 * 1024)) {
      showError('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    setSelectedImages(files);
    
    const urls = files.map(file => URL.createObjectURL(file));
    if (imageUrls.length > 0) {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    }
    setImageUrls(urls);
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) return [];
    
    setIsUploading(true);
    try {
      const response = await apiService.uploadImages(selectedImages);
      return response.image_urls;
    } catch (error) {
      showError('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.length < 50 || content.length > 100) {
      showError('소식은 50-100자 사이로 작성해주세요.');
      return;
    }

    if (selectedImages.length === 0) {
      showError('최소 1장의 이미지를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedImageUrls = await uploadImages();
      if (uploadedImageUrls.length === 0) return;

      await apiService.createPost({
        content,
        image_urls: uploadedImageUrls
      });

      showSuccess('소식이 성공적으로 등록되었습니다!');
      onSuccess();
    } catch (error) {
      console.error('소식 등록 오류:', error);
      showError('소식 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newUrls = imageUrls.filter((_, i) => i !== index);
    URL.revokeObjectURL(imageUrls[index]);
    setSelectedImages(newImages);
    setImageUrls(newUrls);
  };

  const isValid = content.length >= 50 && content.length <= 100 && selectedImages.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            소식 내용
            <span className={`ml-2 text-sm ${
              content.length < 50 ? 'text-red-500' : 
              content.length > 100 ? 'text-red-500' : 
              'text-green-500'
            }`}>
              ({content.length}/100자)
            </span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="가족에게 전하고 싶은 소식을 50-100자로 작성해주세요..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={100}
            required
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center text-sm text-gray-500">
              <AlertCircle className="w-4 h-4 mr-1" />
              최소 50자, 최대 100자
            </div>
            <span className={`text-sm font-medium ${
              content.length < 50 ? 'text-red-500' : 
              content.length > 100 ? 'text-red-500' : 
              'text-green-600'
            }`}>
              {content.length < 50 ? `${50 - content.length}자 더 입력` : 
               content.length > 100 ? `${content.length - 100}자 초과` : 
               '✓ 완료'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            사진 업로드
            <span className="text-sm text-gray-500 ml-2">
              ({selectedImages.length}/4장)
            </span>
          </label>
          
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-700 mb-1">
                  클릭하여 이미지 선택
                </p>
                <p className="text-sm text-gray-500">
                  최대 4장, 각 10MB 이하 (JPG, PNG)
                </p>
              </div>
            </label>
          </div>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg border shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedImages.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center text-sm text-blue-700">
                <ImageIcon className="w-4 h-4 mr-2" />
                {selectedImages.length}장의 이미지가 선택되었습니다
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isUploading}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting || isUploading}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                등록 중...
              </div>
            ) : isUploading ? (
              <div className="flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                업로드 중...
              </div>
            ) : (
              '소식 등록'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
