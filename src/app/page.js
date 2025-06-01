'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  BookOpen, 
  Filter, 
  Search, 
  CheckCircle2, 
  Circle, 
  Edit3, 
  Trash2, 
  Star, 
  BarChart3,
  User,
  LogOut,
  Eye,
  EyeOff,
  Target,
  Timer,
  Award,
  TrendingUp
} from 'lucide-react';

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const AdvancedStudyTodoApp = () => {
  // Move all state declarations first
  const isClient = typeof window !== 'undefined';

  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Task Management States
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);  // Remove default subjects
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    subject: '',
    priority: 'medium',
    estimatedTime: '', // Change from 30 to empty string
    dueDate: '',
    description: '',
    tags: [],
    relatedApp: ''
  });

  // Filter and Search States
  const [filters, setFilters] = useState({
    subject: 'all',
    priority: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [viewMode, setViewMode] = useState('list');

  // Study Timer States
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDownloadInstructions, setShowDownloadInstructions] = useState(false);

  // Study Apps State
  const [studyApps, setStudyApps] = useState(() => {
    if (isClient) {
      return JSON.parse(localStorage.getItem(`studyApps_${currentUser?.id}`) || '[]');
    }
    return [];
  });

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, taskId: null });
  const [appDeleteConfirmation, setAppDeleteConfirmation] = useState({ show: false, appId: null });

  // Initialize data from memory
  useEffect(() => {
    if (isClient) {
      const savedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (savedUser) {
        setCurrentUser(savedUser);
        setIsLoggedIn(true);
        const savedTasks = JSON.parse(localStorage.getItem(`tasks_${savedUser.id}`) || '[]');
        setTasks(savedTasks);
        const savedSubjects = JSON.parse(localStorage.getItem(`subjects_${savedUser.id}`) || '[]');
        if (savedSubjects.length > 0) setSubjects(savedSubjects);
      }
    }
  }, [isClient]);

  // Define completeTask before using it in useEffect
  const completeTask = useCallback((taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? { 
            ...task, 
            completed: true,
            completedAt: new Date().toISOString()
          }
        : task
    );
    setTasks(updatedTasks);
    localStorage.setItem(`tasks_${currentUser?.id}`, JSON.stringify(updatedTasks));
  }, [tasks, currentUser]);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && activeTimer) {
      interval = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(timerSeconds - 1);
        } else if (timerMinutes > 0) {
          setTimerMinutes(timerMinutes - 1);
          setTimerSeconds(59);
        } else {
          setIsTimerRunning(false);
          setActiveTimer(null);
          completeTask(activeTimer);
          alert('Study session completed! 🎉');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMinutes, timerSeconds, activeTimer, completeTask]);

  // Authentication Functions
  const handleAuth = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (showLogin) {
      const user = users.find(u => u.username === authForm.username && u.password === authForm.password);
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
        const savedTasks = JSON.parse(localStorage.getItem(`tasks_${user.id}`) || '[]');
        setTasks(savedTasks);
        
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.id}`);
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
          localStorage.setItem(`onboarding_${user.id}`, 'true');
        }
      } else {
        alert('Invalid credentials!');
      }
    } else {
      if (authForm.password !== authForm.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      if (users.find(u => u.username === authForm.username)) {
        alert('Username already exists!');
        return;
      }
      const newUser = {
        id: Date.now(),
        username: authForm.username,
        password: authForm.password,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      setCurrentUser(newUser);
      setIsLoggedIn(true);
      localStorage.setItem('currentUser', JSON.stringify(newUser));

      // Show onboarding after signup
      setShowOnboarding(true);
      localStorage.setItem(`onboarding_${newUser.id}`, 'true');
    }
    setAuthForm({ username: '', password: '', confirmPassword: '' });
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setTasks([]);
    localStorage.removeItem('currentUser');
  };

  // Task Management Functions
  const saveTask = (e) => {
    e.preventDefault();
    const newTask = {
      id: editingTask ? editingTask.id : Date.now(),
      ...taskForm,
      estimatedTime: taskForm.estimatedTime || 30, // Provide default value if empty
      tags: taskForm.tags.filter(tag => tag.trim()),
      completed: editingTask ? editingTask.completed : false,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      completedAt: editingTask ? editingTask.completedAt : null,
      timeSpent: editingTask ? editingTask.timeSpent : 0
    };

    let updatedTasks;
    if (editingTask) {
      updatedTasks = tasks.map(task => task.id === editingTask.id ? newTask : task);
    } else {
      updatedTasks = [...tasks, newTask];
    }
    
    setTasks(updatedTasks);
    localStorage.setItem(`tasks_${currentUser.id}`, JSON.stringify(updatedTasks));
    
    resetTaskForm();
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      subject: '',
      priority: 'medium',
      estimatedTime: '', // Change from 30 to empty string
      dueDate: '',
      description: '',
      tags: [],
      relatedApp: ''
    });
    setEditingTask(null);
    setShowTaskForm(false);
  };

  const editTask = (task) => {
    setTaskForm(task);
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const deleteTask = (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      localStorage.setItem(`tasks_${currentUser.id}`, JSON.stringify(updatedTasks));
    }
  };

  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? { 
            ...task, 
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : null
          }
        : task
    );
    setTasks(updatedTasks);
    localStorage.setItem(`tasks_${currentUser.id}`, JSON.stringify(updatedTasks));
  };

  // Timer Functions
  const startTimer = (task) => {
    setActiveTimer(task.id);
    setTimerMinutes(task.estimatedTime);
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const stopTimer = () => {
    setActiveTimer(null);
    setIsTimerRunning(false);
    setTimerMinutes(0);
    setTimerSeconds(0);
  };

  // Add new subject
  const addSubject = (newSubject) => {
    if (newSubject && !subjects.includes(newSubject)) {
      const updatedSubjects = [...subjects, newSubject];
      setSubjects(updatedSubjects);
      localStorage.setItem(`subjects_${currentUser.id}`, JSON.stringify(updatedSubjects));
    }
  };

  // Remove subject
  const removeSubject = (subjectToRemove) => {
    if (tasks.some(task => task.subject === subjectToRemove)) {
      alert('Cannot remove subject that has associated tasks');
      return;
    }
    const updatedSubjects = subjects.filter(subject => subject !== subjectToRemove);
    setSubjects(updatedSubjects);
    localStorage.setItem(`subjects_${currentUser.id}`, JSON.stringify(updatedSubjects));
  };

  // Handle adding study app
  const handleAddApp = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newApp = {
      id: Date.now(),
      name: formData.get('name'),
      description: formData.get('description'),
      url: formData.get('url')
    };
    
    const updatedApps = [...studyApps, newApp];
    setStudyApps(updatedApps);
    localStorage.setItem(`studyApps_${currentUser.id}`, JSON.stringify(updatedApps));
    e.target.reset();
  };

  // Handle removing study app
  const handleRemoveApp = (appId) => {
    setAppDeleteConfirmation({ show: true, appId });
  };

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = filters.subject === 'all' || task.subject === filters.subject;
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
      const matchesStatus = filters.status === 'all' || 
                           (filters.status === 'completed' && task.completed) ||
                           (filters.status === 'pending' && !task.completed);
      
      return matchesSearch && matchesSubject && matchesPriority && matchesStatus;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, searchTerm, filters, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;
    const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
    const overdue = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
    const totalTimeSpent = tasks.reduce((acc, task) => acc + (task.timeSpent || 0), 0);
    
    return { completed, pending, highPriority, overdue, totalTimeSpent, total: tasks.length };
  }, [tasks]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">StudyTracker</h1>
            <p className="text-gray-600 mt-2">Your advanced study companion</p>
          </div>

          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                showLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !showLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                required
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example123"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!showLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
              {showLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            {!isMobileDevice() && (
              <>
                <button
                  onClick={() => setShowDownloadInstructions(true)}
                  className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3l-3-3" />
                  </svg>
                  <span>Download Android App</span>
                </button>

                {showDownloadInstructions && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Download Instructions</h3>
                        <button
                          onClick={() => setShowDownloadInstructions(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">1</span>
                          </div>
                          <p className="text-gray-600">Click on the download link below</p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">2</span>
                          </div>
                          <p className="text-gray-600">Click &quot;Install&quot; when prompted</p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">3</span>
                          </div>
                          <p className="text-gray-600">Click &quot;Install anyway&quot; in security prompt</p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">4</span>
                          </div>
                          <p className="text-gray-600">Click &quot;OK&quot; to complete installation</p>
                        </div>

                        <div className="mt-6">
                          <a
                            href="https://storage.googleapis.com/appilder/app/9247ec98570744a37548bac785608261/d7a9ad9871e8f743137165161a48c2de.apk?GoogleAccessId=desktopapi%40appilder-com.iam.gserviceaccount.com&Expires=1749652416&Signature=lEnBoK9KQFjO3v%2B9OOq3rNTbNXYjEJnGME%2FU6FEZ8Tw0bqlkQR3nr0EzXPiM66YfFnfrXEosDyl09F4S1Hl9q2Q5lkZA7cjYWC%2Bx%2BblDU%2FTiE0kWpWN2U%2B223gmlciuFlN%2F5gopGqvKMoEwlEeDp75YwhDjOk%2BNK%2F6U54aEnVjLAgO4YtXj48Ikn8ia6XhIU2U3qEKBUlgnkqgs%2BYqHip0BQ68%2BtQXYJoNeSUXWpfpPCr%2Fhm97fiKchQ2cyQZpBBR7gtPTarNS3xfpY1F8PMVMZ0BhcfoyCXQzAMjTY8i2kXI8fZPzSMaPLmiCpdg1zvq6B%2FOH1lFoCMjTqmcy%2FxuA%3D%3D"
                            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            Download Now
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StudyTracker</h1>
                <p className="text-sm text-gray-500">Welcome back, {currentUser.username}!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Add the Android download button */}
              {!isMobileDevice() && (
                <>
                  <button
                    onClick={() => setShowDownloadInstructions(true)}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3l-3-3" />
                    </svg>
                    <span>Download App</span>
                  </button>

                  {/* Add the download instructions modal */}
                  {showDownloadInstructions && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-gray-900">Download Instructions</h3>
                          <button
                            onClick={() => setShowDownloadInstructions(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">1</span>
                            </div>
                            <p className="text-gray-600">Click on the download link below</p>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">2</span>
                            </div>
                            <p className="text-gray-600">Click &quot;Install&quot; when prompted</p>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">3</span>
                            </div>
                            <p className="text-gray-600">Click &quot;Install anyway&quot; in security prompt</p>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">4</span>
                            </div>
                            <p className="text-gray-600">Click &quot;OK&quot; to complete installation</p>
                          </div>

                          <div className="mt-6">
                            <a
                              href="https://storage.googleapis.com/appilder/app/9247ec98570744a37548bac785608261/d7a9ad9871e8f743137165161a48c2de.apk?GoogleAccessId=desktopapi%40appilder-com.iam.gserviceaccount.com&Expires=1749652416&Signature=lEnBoK9KQFjO3v%2B9OOq3rNTbNXYjEJnGME%2FU6FEZ8Tw0bqlkQR3nr0EzXPiM66YfFnfrXEosDyl09F4S1Hl9q2Q5lkZA7cjYWC%2Bx%2BblDU%2FTiE0kWpWN2U%2B223gmlciuFlN%2F5gopGqvKMoEwlEeDp75YwhDjOk%2BNK%2F6U54aEnVjLAgO4YtXj48Ikn8ia6XhIU2U3qEKBUlgnkqgs%2BYqHip0BQ68%2BtQXYJoNeSUXWpfpPCr%2Fhm97fiKchQ2cyQZpBBR7gtPTarNS3xfpY1F8PMVMZ0BhcfoyCXQzAMjTY8i2kXI8fZPzSMaPLmiCpdg1zvq6B%2FOH1lFoCMjTqmcy%2FxuA%3D%3D"
                              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                            >
                              Download Now
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Timer Display */}
              {activeTimer && (
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <Timer className="w-5 h-5 text-blue-600" />
                  <span className="font-mono text-lg font-semibold text-blue-700">
                    {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                  </span>
                  <button
                    onClick={pauseTimer}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {isTimerRunning ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={stopTimer}
                    className="text-red-600 hover:text-red-800"
                  >
                    Stop
                  </button>
                </div>
              )}
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowOnboarding(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to StudyTracker! 🎉</h2>
              <p className="text-gray-600">Here&apos;s a quick guide to get you started</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Create Tasks</h3>
                  <p className="text-gray-600">Click the &quot;Add Task&quot; button to create new study tasks with titles, subjects, and due dates.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Timer className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Study Timer</h3>
                  <p className="text-gray-600">Use the built-in timer to track your study sessions and maintain focus.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Filter className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Organize & Filter</h3>
                  <p className="text-gray-600">Use filters and sorting options to manage your tasks effectively.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Track Progress</h3>
                  <p className="text-gray-600">Monitor your study progress with detailed statistics and insights.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => setShowOnboarding(false)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                Got it, let&apos;s start!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Circle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
              </div>
              <Star className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-purple-600">{stats.overdue}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <select
                  value={filters.subject}
                  onChange={(e) => setFilters({...filters, subject: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dueDate">Sort by Due Date</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="subject">Sort by Subject</option>
                  <option value="created">Sort by Created</option>
                </select>

                <button
                  onClick={() => setShowTaskForm(true)
                  }
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-90vh overflow-y-auto custom-scrollbar modal-content">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTask ? 'Edit Task' : 'Add New Task'}
                </h2>
              </div>
              
              <form onSubmit={saveTask} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                    <input
                      type="text"
                      required
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter task title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <select
                      required
                      value={taskForm.subject}
                      onChange={(e) => setTaskForm({...taskForm, subject: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={taskForm.estimatedTime || ''} // Add fallback empty string
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value, 10) : '';
                        setTaskForm({...taskForm, estimatedTime: value});
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="datetime-local"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add task description..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={taskForm.tags.join(', ')}
                      onChange={(e) => setTaskForm({...taskForm, tags: e.target.value.split(',').map(tag => tag.trim())})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="exam, homework, project..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Related Study App (Optional)</label>
                    <div className="flex space-x-2">
                      <select
                        value={taskForm.relatedApp}
                        onChange={(e) => setTaskForm({...taskForm, relatedApp: e.target.value})}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a study app (optional)</option>
                        {studyApps.map(app => (
                          <option key={app.id} value={app.id}>{app.name}</option>
                        ))}
                      </select>
                      {taskForm.relatedApp && (
                        <a
                          href={studyApps.find(app => app.id === parseInt(taskForm.relatedApp))?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Open App
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetTaskForm}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                  >
                    {editingTask ? 'Update Task' : 'Add Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Tasks ({filteredTasks.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200 overflow-y-auto custom-scrollbar">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first study task!</p>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Your First Task</span>
                </button>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className={`p-6 hover:bg-gray-50 transition-colors ${task.completed ? 'opacity-75' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="mt-1"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.priority === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{task.subject}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{task.estimatedTime} min</span>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span className={new Date(task.dueDate) < new Date() && !task.completed ? 'text-red-600 font-medium' : ''}>
                                {new Date(task.dueDate).toLocaleDateString()} {new Date(task.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                        )}

                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {task.tags.map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {task.completed && task.completedAt && (
                          <p className="text-xs text-green-600">
                            Completed on {new Date(task.completedAt).toLocaleDateString()} at {new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        )}

                        {task.relatedApp && (
                          <div className="mt-2">
                            <a
                              href={studyApps.find(app => app.id === parseInt(task.relatedApp))?.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>{studyApps.find(app => app.id === parseInt(task.relatedApp))?.name}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {!task.completed && (
                        <button
                          onClick={() => startTimer(task)}
                          disabled={activeTimer === task.id}
                          className={`p-2 rounded-lg transition-colors ${
                            activeTimer === task.id 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Start Study Timer"
                        >
                          <Timer className="w-5 h-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => editTask(task)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Task"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => setDeleteConfirmation({ show: true, taskId: task.id })}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subject Management */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Subjects</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {subjects.map(subject => (
              <span key={subject} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {subject}
                <button
                  onClick={() => removeSubject(subject)}
                  className="ml-2 text-indigo-600 hover:text-indigo-800"
                  title="Remove Subject"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.target.elements.newSubject;
              const newSubject = input.value.trim();
              if (newSubject && !subjects.includes(newSubject)) {
                addSubject(newSubject);
                input.value = '';
              }
            }}
            className="flex space-x-2"
          >
            <input
              type="text"
              name="newSubject"
              placeholder="Add new subject..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Subject
            </button>
          </form>
        </div>

        {/* Study Apps Management */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Apps & Resources</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {studyApps.map((app) => (
              <div key={app.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex flex-col h-full">
                  <h4 className="font-medium text-gray-900 mb-1">{app.name}</h4>
                  <p className="text-sm text-gray-500 mb-4 flex-grow">{app.description}</p>
                  <div className="flex justify-between items-center">
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Open App
                    </a>
                    <button
                      onClick={() => handleRemoveApp(app.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddApp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Quizlet, Khan Academy"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <input
                type="url"
                name="url"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                name="description"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the app..."
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Study App
              </button>
            </div>
          </form>
        </div>

        {/* Progress Analytics */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subject-wise Progress */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress by Subject</h3>
            <div className="space-y-4">
              {subjects.map(subject => {
                const subjectTasks = tasks.filter(task => task.subject === subject);
                const completedTasks = subjectTasks.filter(task => task.completed);
                const progress = subjectTasks.length > 0 ? (completedTasks.length / subjectTasks.length) * 100 : 0;
                
                return (
                  <div key={subject} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{subject}</span>
                      <span className="text-sm text-gray-500">
                        {completedTasks.length}/{subjectTasks.length} tasks
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">{Math.round(progress)}% complete</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {tasks
                .filter(task => task.completed)
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .slice(0, 5)
                .map(task => (
                  <div key={task.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        {task.subject} • Completed {new Date(task.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              {tasks.filter(task => task.completed).length === 0 && (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No completed tasks yet</p>
                  <p className="text-sm text-gray-400">Complete some tasks to see your progress!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Study Insights */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-sm text-white p-6">
          <h3 className="text-lg font-semibold mb-4">Study Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{Math.round((stats.completed / Math.max(stats.total, 1)) * 100)}%</div>
              <div className="text-blue-100">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {tasks.filter(t => t.completed).reduce((acc, task) => acc + (task.estimatedTime || 0), 0)}
              </div>
              <div className="text-blue-100">Minutes Studied</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {tasks.filter(t => t.completed && new Date(t.completedAt).toDateString() === new Date().toDateString()).length}
              </div>
              <div className="text-blue-100">Tasks Today</div>
            </div>
          </div>
        </div>

        {/* Onboarding Modal */}
        {showOnboarding && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Welcome to StudyTracker!
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-gray-700">
                  Thank you for signing up! We&apos;re excited to help you manage your study tasks effectively.
                </p>

                <div className="space-y-2">
                  <p className="font-medium text-gray-800">Here&apos;s what you can do:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li className="text-gray-600">✔️ Add, edit, and delete your study tasks.</li>
                    <li className="text-gray-600">✔️ Organize tasks by subjects and priorities.</li>
                    <li className="text-gray-600">✔️ Track your study time with our built-in timer.</li>
                    <li className="text-gray-600">✔️ Monitor your progress with insightful analytics.</li>
                  </ul>
                </div>

                <p className="text-gray-700">
                  Let&apos;s get started by adding your first study task. Click the &quot;Add Task&quot; button and fill in the details.
                </p>
              </div>

              <div className="p-4 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Got it, thanks!
                </button>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                >
                  Add My First Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white border-t mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              StudyTracker
            </span>
          </div>
          <p className="text-gray-600 mb-2">
            Developed with by{' '}
            <a
              href="https://portfoliohimanshu.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Himanshu Raj
            </a>
          </p>
          <div className="flex items-center space-x-4 text-gray-400">
            <a
              href="https://portfoliohimanshu.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              Portfolio
            </a>
            <span>•</span>
            <p className="text-sm">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </div>
      </div>
    </footer>

    {/* Delete Confirmation Modal */}
    {deleteConfirmation.show && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Task</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => setDeleteConfirmation({ show: false, taskId: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const updatedTasks = tasks.filter(task => task.id !== deleteConfirmation.taskId);
                  setTasks(updatedTasks);
                  localStorage.setItem(`tasks_${currentUser.id}`, JSON.stringify(updatedTasks));
                  setDeleteConfirmation({ show: false, taskId: null });
                }}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* App Delete Confirmation Modal */}
    {appDeleteConfirmation.show && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-overlay">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 confirmation-modal">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Study App</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this app? You can add it back later if needed.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => setAppDeleteConfirmation({ show: false, appId: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const updatedApps = studyApps.filter(app => app.id !== appDeleteConfirmation.appId);
                  setStudyApps(updatedApps);
                  localStorage.setItem(`studyApps_${currentUser.id}`, JSON.stringify(updatedApps));
                  setAppDeleteConfirmation({ show: false, appId: null });
                }}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default AdvancedStudyTodoApp;