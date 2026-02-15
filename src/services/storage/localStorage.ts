import { Project } from '../../types';

const STORAGE_KEYS = {
  PROJECTS: 'provoke-studio-projects',
  CURRENT_PROJECT_ID: 'provoke-studio-current-project-id',
};

export class LocalStorageService {
  // Projects
  static getAllProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  }

  static saveProject(project: Project): void {
    const projects = this.getAllProjects();
    const existingIndex = projects.findIndex((p) => p.id === project.id);

    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  static getProject(id: string): Project | null {
    const projects = this.getAllProjects();
    return projects.find((p) => p.id === id) || null;
  }

  static deleteProject(id: string): void {
    const projects = this.getAllProjects();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
  }

  // Current project ID
  static getCurrentProjectId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
  }

  static setCurrentProjectId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, id);
  }

  static clearCurrentProjectId(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
  }
}
