export const revenuePaths = [
  {
    index: "01",
    title: "Grants",
    proof: "Target streams",
    detailTitle: "Regional grant strategy",
    detail:
      "Split the same story into region-specific funding arguments instead of one generic application.",
    stats: [
      { value: "54%", label: "Dutch-language participation" },
      { value: "41%", label: "French-language participation" },
      { value: "5%", label: "Other language communities" },
    ],
  },
  {
    index: "02",
    title: "Age gaps",
    proof: "Fund segments",
    detailTitle: "Age-targeted funding",
    detail:
      "Use the age profile to fund adult programmes while separately showing the youth recruitment gap.",
    stats: [
      { value: "63%", label: "athletes are 30+" },
      { value: "<10%", label: "youth pipeline share" },
      { value: "2", label: "funding stories, not one" },
    ],
  },
  {
    index: "03",
    title: "Recovery",
    proof: "Show need",
    detailTitle: "Recovery funding",
    detail:
      "Frame recovery as an evidence-backed need with a clear pre-COVID benchmark.",
    stats: [
      { value: "3,482", label: "2019 athlete peak" },
      { value: "2,788", label: "2025 athletes" },
      { value: "-20%", label: "below peak" },
    ],
  },
  {
    index: "04",
    title: "Retention",
    proof: "Fix leaks",
    detailTitle: "Retention and efficiency",
    detail:
      "Find sports where participation leaks faster, then target support before it becomes lost revenue.",
    stats: [
      { value: "91.1%", label: "Triathlon retention" },
      { value: "48.6%", label: "Bowling retention" },
      { value: "42.5pt", label: "gap to investigate" },
    ],
  },
  {
    index: "05",
    title: "Events",
    proof: "Place by demand",
    detailTitle: "Smarter event placement",
    detail:
      "Use province movement to decide where events, transport, volunteers, and local partners matter most.",
    stats: [
      { value: "+22.6%", label: "West-Vlaanderen athlete growth" },
      { value: "-14.5%", label: "Hainaut athlete change" },
      { value: "#1", label: "West-Vlaanderen becomes 2025 leader" },
    ],
  },
  {
    index: "06",
    title: "Sponsors",
    proof: "Prove impact",
    detailTitle: "Sponsor impact reporting",
    detail:
      "Turn performance and reach into proof a sponsor can repeat in renewal conversations.",
    stats: [
      { value: "340", label: "Athletics gold medals" },
      { value: "197", label: "Aquatics gold medals" },
      { value: "167", label: "Netball gold medals" },
    ],
  },
];

export type RevenuePath = (typeof revenuePaths)[number];
