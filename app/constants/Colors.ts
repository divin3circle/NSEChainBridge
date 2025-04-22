export const fonts = {
  regular: "OpenSansRegular",
  semiBold: "OpenSansSemibold",
  light: "OpenSansLight",
  bold: "OpenSansBold",
};

export const Colors = {
  light: {
    primary: "#0961F5",
    background: "#F5F9FF",
    tint: "#E8F1FF",
    secondary: "#167F71",
    accent: "#FF6B00",
    titles: "#202244",
    subtitles: "#545454",
    muted: "#A0A4AB",
  },
  dark: {
    background: "#000",
    titles: "#FFF",
    subtitles: "#A0A4AB",
  },
};

export const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export const TOOLS = [
  {
    id: "portfolio-trends",
    name: "Compare",
    icon: "trending-up",
    image: require("../../assets/images/compare-tool-image.png"),
    description: "Compare portfolio with market trends",
  },
  {
    id: "trading-actions",
    name: "Trade",
    icon: "swap-horizontal",
    image: require("../../assets/images/trade-tool-image.webp"),
    description: "Execute trading actions",
  },
  {
    id: "generate-report",
    name: "Report",
    icon: "document-text",
    image: require("../../assets/images/report-tool-image.png"),
    description: "Generate portfolio analysis report",
  },
  {
    id: "balances",
    name: "Balances",
    icon: "wallet",
    image: require("../../assets/images/balance-tool-image.png"),
    description: "View token and stock balances",
  },
];
