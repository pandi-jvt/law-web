import { Suspense, ComponentType } from 'react';
import Loader from './Loader';

// ==============================|| LOADABLE - LAZY LOADING ||============================== //

const Loadable = <P extends object>(Component: ComponentType<P>) => {
  return function LoadableComponent(props: P): React.ReactElement {
    return (
      <Suspense fallback={<Loader />}>
        <Component {...props} />
      </Suspense>
    );
  };
};

export default Loadable;
