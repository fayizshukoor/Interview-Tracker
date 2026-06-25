import { createBrowserRouter } from 'react-router-dom';
import CandidatesPage from '../pages/CandidatesPage';
import QuestionsPage from '../pages/QuestionsPage';
import ReviewPage from '../pages/ReviewPage';
import NotFoundPage from '../pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <CandidatesPage />,
  },
  {
    path: '/questions',
    element: <QuestionsPage />,
  },
  {
    path: '/reviews',
    element: <ReviewPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
