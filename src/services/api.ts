import {
  User,
  FamilyGroup,
  Post,
  Issue,
  FamilyMember,
  Book,
  Subscription,
  KakaoLoginResponse,
  PostCreate,
  ImageUploadResponse,
  Recipient
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  private isTokenValid(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1]));
      const expiry = new Date(payload.exp * 1000);
      const now = new Date();
      
      return expiry.getTime() > now.getTime() + (5 * 60 * 1000);
    } catch {
      return false;
    }
  }

  private clearInvalidTokens(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        if (this.isTokenValid(token)) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('만료된 토큰 감지, 자동 제거합니다.');
          this.clearInvalidTokens();
        }
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      this.clearInvalidTokens();
      window.location.href = '/login';
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network Error' }));
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getKakaoLoginUrl(): Promise<{ login_url: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/kakao/url`);
    return this.handleResponse(response);
  }

  async kakaoLogin(code: string): Promise<KakaoLoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/kakao`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ code }),
    });
    return this.handleResponse(response);
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getFamilyGroup(): Promise<FamilyGroup> {
    const response = await fetch(`${API_BASE_URL}/family/my-group`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getRecipient(): Promise<Recipient> {
    const response = await fetch(`${API_BASE_URL}/family/recipient`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async createFamilyGroup(data: Partial<{
    group_name: string;
    deadline_type: string;
    leader_relationship: string;
    recipient_name: string;
    recipient_address: string;
    recipient_address_detail?: string;
    recipient_postal_code?: string;
    recipient_phone?: string;
    recipient_road_address?: string;
    recipient_jibun_address?: string;
    recipient_address_type?: string;
    recipient_latitude?: number;
    recipient_longitude?: number;
    recipient_region_1depth?: string;
    recipient_region_2depth?: string;
    recipient_region_3depth?: string;
  }>): Promise<{ group: FamilyGroup; recipient: any }> {
    const response = await fetch(`${API_BASE_URL}/family/setup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async joinFamilyGroup(data: {
    invite_code: string;
    relationship: string;
  }): Promise<FamilyMember> {
    const response = await fetch(`${API_BASE_URL}/members/join`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async validateInviteCode(inviteCode: string): Promise<{
    valid: boolean;
    group_name: string;
    current_member_count: number;
    max_members: number;
    recipient_name: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/members/validate-invite/${inviteCode}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getFamilyMembers(): Promise<FamilyMember[]> {
    const response = await fetch(`${API_BASE_URL}/members/my-group/members`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async removeFamilyMember(memberId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error('멤버 삭제에 실패했습니다');
    }
  }

  async createPost(data: PostCreate): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/posts/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async uploadImages(files: File[]): Promise<ImageUploadResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (token && this.isTokenValid(token)) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/posts/upload-images`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return this.handleResponse(response);
  }

  async getPosts(): Promise<Post[]> {
    const response = await fetch(`${API_BASE_URL}/posts/`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async updatePost(postId: string, data: Partial<Post>): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deletePost(postId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error('소식 삭제에 실패했습니다');
    }
  }

  async getCurrentIssue(): Promise<Issue> {
    const response = await fetch(`${API_BASE_URL}/issues/current`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async createIssue(data: {
    group_id: string;
    issue_number: number;
    deadline_date: string;
    status: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/issues/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getIssues(): Promise<Issue[]> {
    const response = await fetch(`${API_BASE_URL}/issues/`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getIssue(issueId: string): Promise<Issue> {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async closeIssue(issueId: string): Promise<Issue> {
    const response = await fetch(`${API_BASE_URL}/issues/${issueId}/close`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getBooks(): Promise<Book[]> {
    const response = await fetch(`${API_BASE_URL}/books/`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getBook(bookId: string): Promise<Book> {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async generateBook(issueId: string): Promise<Book> {
    const response = await fetch(`${API_BASE_URL}/books/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ issue_id: issueId }),
    });
    return this.handleResponse(response);
  }

  async getMySubscriptions(): Promise<Subscription[]> {
    const response = await fetch(`${API_BASE_URL}/subscription/my`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async createSubscription(groupId: string): Promise<{
    payment_info: any;
    redirect_url: string;
    mobile_url: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/subscription/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        group_id: groupId,
        payment_method: 'kakao_pay',
      }),
    });
    return this.handleResponse(response);
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const response = await fetch(`${API_BASE_URL}/subscription/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getSystemStats(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();
