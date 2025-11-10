import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import StoryListPage from '../pages/stories/story-list-page';
import StoryDetailPage from '../pages/stories/story-detail-page';
import AddStoryPage from '../pages/stories/add-story-page';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/stories': new StoryListPage(),
  '/story/:id': new StoryDetailPage(),
  '/add': new AddStoryPage(),
};

export default routes;
