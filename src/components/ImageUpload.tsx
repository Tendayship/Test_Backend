import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { Button } from './ui/Button';
import { useNotification } from '../hooks/useNotification';

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  initialImages?: string[];
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  maxImages = 4,
  initialImages = [],
  disabled = false,
}) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, showSuccess } = useNotification();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    if (files.length + images.length > maxImages) {
      showError(`최대 ${maxImages}장까지 업로드 가능합니다`);
      return;
    }

    // 파일 크기 및 형식 검증
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        showError(`${file.name}은 크기가 너무 큽니다 (최대 10MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        showError(`${file.name}은 이미지 파일이 아닙니다`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    
    try {
      const response = await apiService.uploadImages(validFiles);
      const newImages = [...images, ...response.image_urls];
      setImages(newImages);
      onImagesChange(newImages);
      showSuccess(`${validFiles.length}장의 이미지가 업로드되었습니다`);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      showError(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const canUploadMore = images.length < maxImages && !disabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          이미지 ({images.length}/{maxImages})
        </label>
        {canUploadMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={uploading}
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            이미지 선택
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {images.length === 0 && (
        <div 
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${disabled 
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
            }
          `}
          onClick={!disabled ? () => fileInputRef.current?.click() : undefined}
        >
          <ImageIcon className={`w-12 h-12 mx-auto mb-4 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
          <p className={`mb-2 ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
            {disabled ? '이미지 업로드 불가' : '이미지를 업로드하세요'}
          </p>
          {!disabled && (
            <p className="text-sm text-gray-400">
              최대 {maxImages}장까지 업로드 가능 (각각 최대 10MB)
            </p>
          )}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`업로드된 이미지 ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyVjdBMiAyIDAgMCAwIDE5IDVINUEyIDIgMCAwIDAgMyA3VjE3QTIgMiAwIDAgMCA1IDE5SDE0IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjkiIGN5PSI5IiByPSIyIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Im0yMSAxNS0zLjA4Ni0zLjA4NmEyIDIgMCAwIDAtMi44MjggMEw2IDIxIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==';
                }}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  aria-label={`이미지 ${index + 1} 삭제`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          
          {/* 추가 업로드 버튼 */}
          {canUploadMore && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
            >
              <Upload className="w-8 h-8 mb-2" />
              <span className="text-sm">추가</span>
            </button>
          )}
        </div>
      )}

      {/* 업로드 안내 */}
      {!disabled && images.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle className="w-4 h-4" />
          <span>이미지를 클릭하여 미리보기, X 버튼으로 삭제</span>
        </div>
      )}
    </div>
  );
};