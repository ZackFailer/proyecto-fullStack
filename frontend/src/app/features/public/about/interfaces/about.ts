export interface IAboutHeaderAction {
  label: string;
  icon?: string;
  route: string;
  buttonStyle?: string;
}

export interface IAboutHeader {
  context: string;
  description: string;
  icon: string;
  actions: ReadonlyArray<IAboutHeaderAction>;
}

export interface IAboutChip {
  label: string;
  icon?: string;
}

export interface IAboutSummaryCard {
  title: string;
  description: string;
}

export interface IAboutOverview {
  headline: string;
  subtitle: string;
  chips: ReadonlyArray<IAboutChip>;
  cards: ReadonlyArray<IAboutSummaryCard>;
}

export interface IAboutDecisionItem {
  label: string;
  detail: string;
}

export interface IAboutRoadmapItem {
  label: string;
  detail: string;
}

export interface IAboutDecisions {
  decisions: ReadonlyArray<IAboutDecisionItem>;
  justification: string;
  roadmap: ReadonlyArray<IAboutRoadmapItem>;
  values: ReadonlyArray<string>;
}

export interface IAboutExperience {
  title: string;
  detail: string;
}

export interface IAboutContactLink {
  label: string;
  icon?: string;
  href: string;
}

export interface IAboutAuthor {
  name: string;
  role: string;
  summary: string;
  experiences: ReadonlyArray<IAboutExperience>;
  expertise?: string;
  contacts: ReadonlyArray<IAboutContactLink>;
  feedback: string;
}
