export interface Project {
  name: string;
  tech: string[];
  desc: string;
  link: string;
}

export interface Experience {
  period: string;
  role: string;
  company: string;
  desc: string;
}

export interface Skills {
  languages: string[];
  frontend: string[];
  backend: string[];
  Infrastructure: string[];
}

export interface Research {
  title: string;
  desc: string;
}

export interface PortfolioData {
  name: string;
  role: string;
  bio: string;
  skills: Skills;
  projects: Project[];
  experiences: Experience[];
  research?: Research[];
  education?: {
    period: string;
    degree: string;
    institution: string;
  }[];
  awards?: {
    date: string;
    title: string;
    desc: string;
  }[];
  publications?: {
    year: string;
    title: string;
    publisher: string;
    link?: string;
  }[];
  hobbies?: string[];
  contact: {
    github: string;
    LinkedIn: string;
    email: string;
    orcid?: string;
    twitter?: string;
  };
}
