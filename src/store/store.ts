import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { dashboardReducer } from '@/features/dashboard/store';
import { datasetsReducer } from '@/features/datasets/store';
import { apiCatalogReducer } from '@/features/api-catalog/store';
import { approvalReducer } from '@/features/approval/store';
import { managementReducer } from '@/features/management/store';

type PreloadedState<T> = Partial<T>;

const rootReducer = {
  dashboard: dashboardReducer,
  datasets: datasetsReducer,
  apiCatalog: apiCatalogReducer,
  approval: approvalReducer,
  management: managementReducer,
};

const reducer = combineReducers(rootReducer);

export type RootState = ReturnType<typeof reducer>;

export const createAppStore = (preloadedState?: PreloadedState<RootState>) => {
  try {
    return configureStore({
      reducer,
      preloadedState,
      devTools: true,
    });
  } catch {
    return configureStore({
      reducer,
      preloadedState,
      devTools: false,
    });
  }
};

export const store = createAppStore();
export type AppDispatch = typeof store.dispatch;
