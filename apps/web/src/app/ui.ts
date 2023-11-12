import type {LabeledRoute} from 'ui';

interface UserInterface {
  header: {
    menu: LabeledRoute[];
  };
  footer: {
    menu: LabeledRoute[];
  };
};

export const ui: UserInterface = {
  header: {
    menu: [{
      label: 'home',
      route: '/'
    },{
      label: 'about',
      route: '/about'
    },{
      label: 'contact',
      route: '/contact'
    }]
  },
  footer: {
    menu: [{
      label: 'credits',
      route: '/credits'
    },{
      label: 'terms',
      route: '/terms'
    },{
      label: 'privacy',
      route: '/privacy'
    }]
  }
};
