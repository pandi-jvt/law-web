// assets
import { LoginOutlined, ProfileOutlined } from '@ant-design/icons';

// icons
const icons = {
  LoginOutlined,
  ProfileOutlined
};

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //

const pages = {
  id: 'authentication',
  // title: 'Authentication',
  type: 'group',
  children: [
    // {
    //   id: 'login1',
    //   title: 'Login',
    //   type: 'item',
    //   url: '/login',
    //   icon: icons.LoginOutlined,
    //   target: true
    // },
    {
      id: 'cases',
      title: 'Cases',
      type: 'item',
      url: '/cases',
      icon: icons.ProfileOutlined,
      // target: true
    },
    {
      id: 'client',
      title: 'Client',
      type: 'item',
      url: '/client',
      icon: icons.ProfileOutlined,
      // target: true
    },
    {
      id: 'task',
      title: 'Tasks',
      type: 'item',
      url: '/task',
      icon: icons.ProfileOutlined,
      // target: true
    }
  ]
};

export default pages;
