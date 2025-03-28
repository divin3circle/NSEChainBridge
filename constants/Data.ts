export interface Stock {
  image: string;
  code: string;
  name: string;
  low_12min: number;
  high_12min: number;
  dayLow: number;
  dayHigh: number;
  dayPrice: number;
  previous: number;
  change: number;
  changePercentage: number;
  volume: number;
  adjust: number;
  date: string;
}

export interface Movers extends Stock {
  moverGraph: string;
}

export interface MyStocks extends Movers {
  stockBlanace: number;
  kesBalance: number;
  lockedQuantity?: number;
}
// export const API_BASE_URL = "http://localhost:5004/api";

export interface MyTokens extends MyStocks {
  tokenId?: string;
  circulatingSupply?: number;
  totalSupply?: number;
}

export interface Stock {
  image: string;
  code: string;
  name: string;
  low_12min: number;
  high_12min: number;
  dayLow: number;
  dayHigh: number;
  dayPrice: number;
  previous: number;
  change: number;
  changePercentage: number;
  volume: number;
  adjust: number;
  date: string;
}

export interface Movers extends Stock {
  moverGraph: string;
}

export interface MyStocks extends Movers {
  stockBlanace: number;
  kesBalance: number;
}
export const API_BASE_URL = "http://localhost:5004/api";

export interface MyTokens extends MyStocks {}

export type Category = "All" | "Losers" | "Gainers" | "Watchlist";

export const topMovers: Movers[] = [
  {
    image: require("../assets/images/kcb.png"),
    code: "KCB",
    name: "KCB Group",
    low_12min: 33.75,
    high_12min: 55.5,
    dayLow: 28.75,
    dayHigh: 29.25,
    dayPrice: 29,
    previous: 28.75,
    change: 0.25,
    changePercentage: 0.87,
    volume: 1580800,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/kcb.svg"),
  },
  {
    image: require("../assets/images/eqty.png"),
    code: "EQTY",
    name: "Equity Group",
    low_12min: 30.5,
    high_12min: 55.5,
    dayLow: 30,
    dayHigh: 30,
    dayPrice: 30,
    previous: 30,
    change: 0,
    changePercentage: 0,
    volume: 1986200,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/eqty.svg"),
  },
  {
    image: require("../assets/images/safaricom.png"),
    code: "SCOM",
    name: "Safaricom",
    low_12min: 23.5,
    high_12min: 33.5,
    dayLow: 18.9,
    dayHigh: 19.2,
    dayPrice: 19,
    previous: 19.1,
    change: -0.1,
    changePercentage: 0.52,
    volume: 10112100,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/scom.svg"),
  },
  {
    image: require("../assets/images/eabl.webp"),
    code: "EABL",
    name: "East African Breweries",
    low_12min: 135,
    high_12min: 222.25,
    dayLow: 240,
    dayHigh: 245,
    dayPrice: 240,
    previous: 244,
    change: -4,
    changePercentage: 1.64,
    volume: 52600,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/eabl.svg"),
  },
];

export const myStocks: MyStocks[] = [
  {
    image: require("../assets/images/kcb.png"),
    code: "KCB",
    name: "KCB Group",
    low_12min: 33.75,
    high_12min: 55.5,
    dayLow: 28.75,
    dayHigh: 29.25,
    dayPrice: 29,
    previous: 28.75,
    change: 0.25,
    changePercentage: 0.87,
    volume: 1580800,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/kcb.svg"),
    stockBlanace: 3000,
    kesBalance: 0,
  },
  {
    image: require("../assets/images/eqty.png"),
    code: "EQTY",
    name: "Equity Group",
    low_12min: 30.5,
    high_12min: 55.5,
    dayLow: 30,
    dayHigh: 30,
    dayPrice: 30,
    previous: 30,
    change: 0,
    changePercentage: 0,
    volume: 1986200,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/eqty.svg"),
    stockBlanace: 2300,
    kesBalance: 0,
  },
  {
    image: require("../assets/images/safaricom.png"),
    code: "SCOM",
    name: "Safaricom",
    low_12min: 23.5,
    high_12min: 33.5,
    dayLow: 18.9,
    dayHigh: 19.2,
    dayPrice: 19,
    previous: 19.1,
    change: -0.1,
    changePercentage: 0.52,
    volume: 10112100,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/scom.svg"),
    stockBlanace: 2600,
    kesBalance: 0,
  },
  {
    image: require("../assets/images/eabl.webp"),
    code: "EABL",
    name: "East African Breweries",
    low_12min: 135,
    high_12min: 222.25,
    dayLow: 240,
    dayHigh: 245,
    dayPrice: 240,
    previous: 244,
    change: -4,
    changePercentage: 1.64,
    volume: 52600,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/eabl.svg"),
    stockBlanace: 150,
    kesBalance: 0,
  },
];
export const myTokens: MyTokens[] = [
  {
    image: require("../assets/images/kcb.png"),
    code: "KCB",
    name: "KCB Group",
    low_12min: 33.75,
    high_12min: 55.5,
    dayLow: 28.75,
    dayHigh: 29.25,
    dayPrice: 29,
    previous: 28.75,
    change: 0.25,
    changePercentage: 0.87,
    volume: 1580800,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/kcb.svg"),
    stockBlanace: 3000,
    kesBalance: 0,
  },
  {
    image: require("../assets/images/eqty.png"),
    code: "EQTY",
    name: "Equity Group",
    low_12min: 30.5,
    high_12min: 55.5,
    dayLow: 30,
    dayHigh: 30,
    dayPrice: 30,
    previous: 30,
    change: 0,
    changePercentage: 0,
    volume: 1986200,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/eqty.svg"),
    stockBlanace: 2300,
    kesBalance: 0,
  },
  {
    image: require("../assets/images/hbar.svg"),
    code: "HBAR",
    name: "Hedera",
    low_12min: 0.16,
    high_12min: 0.5,
    dayLow: 0.11,
    dayHigh: 0.89,
    dayPrice: 0.21,
    previous: 0.21,
    change: 0,
    changePercentage: 0,
    volume: 10986200,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/eqty.svg"),
    stockBlanace: 21300,
    kesBalance: 0,
  },
  {
    image: require("../assets/images/safaricom.png"),
    code: "SCOM",
    name: "Safaricom",
    low_12min: 23.5,
    high_12min: 33.5,
    dayLow: 18.9,
    dayHigh: 19.2,
    dayPrice: 19,
    previous: 19.1,
    change: -0.1,
    changePercentage: -0.52,
    volume: 10112100,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/scom.svg"),
    stockBlanace: 2600,
    kesBalance: 0,
  },
  {
    image: require("../assets/images/eabl.webp"),
    code: "EABL",
    name: "East African Breweries",
    low_12min: 135,
    high_12min: 222.25,
    dayLow: 240,
    dayHigh: 245,
    dayPrice: 240,
    previous: 244,
    change: -4,
    changePercentage: 1.64,
    volume: 52600,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/eabl.svg"),
    stockBlanace: 150,
    kesBalance: 0,
  },
  {
    image: require("../assets/images/ksh.svg"),
    code: "KSH",
    name: "Kenyan Shilling",
    low_12min: 1,
    high_12min: 1.001,
    dayLow: 1,
    dayHigh: 1.001,
    dayPrice: 1,
    previous: 1,
    change: 0,
    changePercentage: 0,
    volume: 562600,
    adjust: 0,
    date: "03-Jan-17",
    moverGraph: require("../assets/images/eabl.svg"),
    stockBlanace: 12800,
    kesBalance: 0,
  },
];

export const categories: Category[] = ["All", "Gainers", "Losers", "Watchlist"];

export interface StockStats {
  marketCap: number;
  peRatio: number;
  volume24h: number;
  avgVolume: number;
  yearHigh: number;
  yearLow: number;
  dividend: number;
  tokenId: string;
  totalSupply: number;
  circulatingSupply: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  image: any;
}

export interface TimeRange {
  label: string;
  value: string;
}

export const timeRanges: TimeRange[] = [
  { label: "24H", value: "24h" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "1Y", value: "1y" },
  { label: "ALL", value: "all" },
];

export const stockStats: Record<string, StockStats> = {
  KCB: {
    marketCap: 89.5, // Billion KES
    peRatio: 4.8,
    volume24h: 1580800,
    avgVolume: 1200000,
    yearHigh: 42.75,
    yearLow: 25.5,
    dividend: 3.5,
    tokenId: "0.0.1234567",
    totalSupply: 3219600000,
    circulatingSupply: 3000000000,
  },
  EQTY: {
    marketCap: 185.2,
    peRatio: 5.2,
    volume24h: 1986200,
    avgVolume: 1500000,
    yearHigh: 55.25,
    yearLow: 35.0,
    dividend: 4.0,
    tokenId: "0.0.1234568",
    totalSupply: 3773600000,
    circulatingSupply: 3500000000,
  },
  SCOM: {
    marketCap: 760.0,
    peRatio: 12.5,
    volume24h: 10112100,
    avgVolume: 8000000,
    yearHigh: 35.5,
    yearLow: 15.7,
    dividend: 2.5,
    tokenId: "0.0.1234569",
    totalSupply: 40000000000,
    circulatingSupply: 38500000000,
  },
  EABL: {
    marketCap: 95.3,
    peRatio: 18.2,
    volume24h: 52600,
    avgVolume: 45000,
    yearHigh: 280.0,
    yearLow: 140.0,
    dividend: 6.0,
    tokenId: "0.0.1234570",
    totalSupply: 790800000,
    circulatingSupply: 750000000,
  },
};

export const stockNews: Record<string, NewsItem[]> = {
  KCB: [
    {
      id: "1",
      title:
        "KCB Group reports strong Q4 earnings, exceeds market expectations",
      source: "Business Daily",
      date: "2024-03-20",
      image: require("../assets/images/kcb.png"),
    },
    {
      id: "2",
      title: "KCB expands regional presence with new South Sudan branches",
      source: "The Standard",
      date: "2024-03-18",
      image: require("../assets/images/kcb.png"),
    },
  ],
};
