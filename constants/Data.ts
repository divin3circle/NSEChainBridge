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
  tokenBalance: number;
  kesBalance: number;
}

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
    tokenBalance: 3000,
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
    tokenBalance: 2300,
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
    tokenBalance: 2600,
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
    tokenBalance: 150,
    kesBalance: 0,
  },
];

export const categories: Category[] = ["All", "Gainers", "Losers", "Watchlist"];
