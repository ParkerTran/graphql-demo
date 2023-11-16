import { createApplication } from 'graphql-modules';
import { AboutModule } from './about/index';


export const AppModule = createApplication({
  modules: [
    AboutModule,
  ],
});
