interface Book {
  id: number;
  name: string;
  novelIds: number[];
  purchaseLinks: {
    kyoboURL: string;
    yes24URL: string;
    aladinURL: string;
    ridiURL: string;
    naverURL: string;
  };
}
