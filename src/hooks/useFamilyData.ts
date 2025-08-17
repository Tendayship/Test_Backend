import { useState } from 'react';
import { FamilyGroup, FamilyMember, Issue, Post, Book, Recipient } from '../types';
import { apiService } from '../services/api';
import { useNotification } from './useNotification';

export const useFamilyData = () => {
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();

  const loadFamilyGroup = async () => {
    try {
      const group = await apiService.getFamilyGroup();
      setFamilyGroup(group);
      return group;
    } catch (error) {
      console.error('가족 그룹 로드 실패:', error);
      throw error;
    }
  };

  const loadRecipient = async () => {
    try {
      const recipientData = await apiService.getRecipient();
      setRecipient(recipientData);
      return recipientData;
    } catch (error) {
      console.error('받는 분 정보 로드 실패:', error);
      throw error;
    }
  };

  const loadMembers = async () => {
    try {
      const membersData = await apiService.getFamilyMembers();
      setMembers(membersData);
      return membersData;
    } catch (error) {
      console.error('가족 구성원 로드 실패:', error);
      showError('가족 구성원 정보를 불러오는데 실패했습니다');
      return [];
    }
  };

  const loadCurrentIssue = async () => {
    try {
      const issue = await apiService.getCurrentIssue();
      setCurrentIssue(issue);
      return issue;
    } catch (error) {
      console.error('현재 회차 로드 실패:', error);
      return null;
    }
  };

  const loadPosts = async () => {
    try {
      const postsData = await apiService.getPosts();
      setPosts(postsData);
      return postsData;
    } catch (error) {
      console.error('소식 로드 실패:', error);
      showError('소식을 불러오는데 실패했습니다');
      return [];
    }
  };

  const loadBooks = async () => {
    try {
      const booksData = await apiService.getBooks();
      setBooks(booksData);
      return booksData;
    } catch (error) {
      console.error('책자 목록 로드 실패:', error);
      showError('책자 목록을 불러오는데 실패했습니다');
      return [];
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadFamilyGroup(),
        loadRecipient(),
        loadMembers(),
        loadCurrentIssue(),
        loadPosts(),
        loadBooks(),
      ]);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPosts = () => {
    loadPosts();
  };

  const refreshMembers = () => {
    loadMembers();
  };

  const refreshCurrentIssue = () => {
    loadCurrentIssue();
  };

  const refreshBooks = () => {
    loadBooks();
  };

  return {
    familyGroup,
    recipient,
    members,
    currentIssue,
    posts,
    books,
    loading,
    loadFamilyGroup,
    loadRecipient,
    loadMembers,
    loadCurrentIssue,
    loadPosts,
    loadBooks,
    loadAllData,
    refreshPosts,
    refreshMembers,
    refreshCurrentIssue,
    refreshBooks,
    setFamilyGroup,
    setRecipient,
    setCurrentIssue,
    setMembers,
    setPosts,
    setBooks,
  };
};
