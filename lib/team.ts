/** The founding team, shown on the About and Investors pages and in structured data for search engines. */
export type Founder = {
  name: string;
  initials: string;
  role: string;
  focus: string;
  line: string;
  email: string;
  linkedin: string;
};

export const FOUNDERS: Founder[] = [
  {
    name: "Aadit Patadia",
    initials: "AP",
    role: "Co-founder",
    focus: "Sourcing, suppliers and product",
    line: "Aadit finds the makers, holds them to the build sheet and builds the tools engineers use to choose their parts. The person a buyer calls when a part has to be right.",
    email: "aaditpatadia@gmail.com",
    linkedin: "https://www.linkedin.com/in/aaditpatadia/",
  },
  {
    name: "Kashish Shah",
    initials: "KS",
    role: "Co-founder",
    focus: "Brand, design and how Timule is seen",
    line: "Kashish shapes how Timule looks and reads, from the blueprint every document is printed on to the way a spec sheet explains a part. The reason our engineering paperwork is clear enough to trust at a glance.",
    email: "kashishshah.sh@gmail.com",
    linkedin: "https://www.linkedin.com/in/kashish-shah-graphic-designer/",
  },
];
