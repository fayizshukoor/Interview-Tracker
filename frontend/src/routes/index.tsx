import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import CandidatesPage from '../pages/CandidatesPage';
import QuestionsPage from '../pages/QuestionsPage';
import ReviewPage from '../pages/ReviewPage';
import HistoryPage from '../pages/HistoryPage';
import InterviewPage from '../pages/InterviewPage';
import ReviewSummaryPage from '../pages/ReviewSummaryPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/ProtectedRoute';

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/candidates', element: <ProtectedRoute><CandidatesPage /></ProtectedRoute> },
      { path: '/questions', element: <ProtectedRoute><QuestionsPage /></ProtectedRoute> },
      { path: '/reviews', element: <ProtectedRoute><ReviewPage /></ProtectedRoute> },
      { path: '/history', element: <ProtectedRoute><HistoryPage /></ProtectedRoute> },
      { path: '/reviews/:reviewId/interview', element: <ProtectedRoute><InterviewPage /></ProtectedRoute> },
      { path: '/reviews/:reviewId/summary', element: <ProtectedRoute><ReviewSummaryPage /></ProtectedRoute> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
