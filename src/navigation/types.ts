import type { LookId } from '../data/looks';
import type { SeasonId } from '../data/seasons';

export type TabParamList = {
  Scan: undefined;
  Looks: undefined;
  Vault: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Tabs: undefined;
  Camera: undefined;
  Analyzing: undefined;
  Results: { recordId: string; fresh?: boolean };
  LookDetail: { lookId: LookId };
  MakeupMatch: undefined;
  Seasons: { highlight?: SeasonId } | undefined;
  Paywall: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
