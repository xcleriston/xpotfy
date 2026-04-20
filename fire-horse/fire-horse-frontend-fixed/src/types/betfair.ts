// Types for Betfair API responses

export interface BetfairAccountDetails {
  firstName: string;
  lastName: string;
  pointsBalance: number;
  countryCode: string;
  // Add other relevant fields
}

export interface BetfairAccountFunds {
  availableToBetBalance: number;
  exposure: number;
  retainedCommission: number;
  exposureLimit: number;
  discountRate: number;
  pointsBalance: number;
  wallet?: string;
}

export interface Runner {
  selectionId: number;
  runnerName: string;
  handicap: number;
  status: string;
  sortPriority: number;
  metadata: {
    CLOTH_NUMBER: string;
  };
}

export interface MarketBook {
  marketId: string;
  isMarketDataDelayed: boolean;
  status: string;
  betDelay: number;
  bspReconciled: boolean;
  complete: boolean;
  inplay: boolean;
  numberOfWinners: number;
  numberOfRunners: number;
  numberOfActiveRunners: number;
  lastMatchTime?: string;
  totalMatched: number;
  totalAvailable: number;
  crossMatching: boolean;
  runnersVoidable: boolean;
  version: number;
  runners: Runner[];
}

export interface Event {
  event: {
    id: string;
    name: string;
    countryCode: string;
    timezone: string;
    venue: string;
    openDate: string;
  };
  marketCount: number;
  eventType: {
    id: string;
    name: string;
  };
}

export interface MarketCatalogue {
  marketId: string;
  marketName: string;
  marketStartTime: string;
  description: {
    persistenceEnabled: boolean;
    bspMarket: boolean;
    marketTime: string;
    suspendTime: string;
    settleTime?: string;
    bettingType: string;
    turnInPlayEnabled: boolean;
    marketType: string;
    regulator: string;
    marketBaseRate: number;
    discountAllowed: boolean;
    wallet?: string;
    rules?: string;
    rulesHasDate?: boolean;
    clarifications?: string;
  };
  totalMatched: number;
  runners: {
    selectionId: number;
    runnerName: string;
    handicap: number;
    sortPriority: number;
    metadata: {
      CLOTH_NUMBER: string;
    };
  }[];
  eventType: {
    id: string;
    name: string;
  };
  competition: {
    id: string;
    name: string;
  };
  event: {
    id: string;
    name: string;
    countryCode: string;
    timezone: string;
    venue: string;
    openDate: string;
  };
}
