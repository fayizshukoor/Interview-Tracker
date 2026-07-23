import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import CandidatesPage from '../pages/CandidatesPage';
import QuestionsPage from '../pages/QuestionsPage';
import ReviewPage from '../pages/ReviewPage';
import HistoryPage from '../pages/HistoryPage';
import InterviewPage from '../pages/InterviewPage';
import ReviewSummaryPage from '../pages/ReviewSummaryPage';
import NotFoundPage from '../pages/NotFoundPage';

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/',                            element: <HomePage /> },
      { path: '/candidates',                  element: <CandidatesPage /> },
      { path: '/questions',                   element: <QuestionsPage /> },
      { path: '/reviews',                     element: <ReviewPage /> },
      { path: '/history',                     element: <HistoryPage /> },
      { path: '/reviews/:reviewId/interview', element: <InterviewPage /> },
      { path: '/reviews/:reviewId/summary',   element: <ReviewSummaryPage /> },
      { path: '*',                            element: <NotFoundPage /> },
    ],
  },
]);

export default router;
