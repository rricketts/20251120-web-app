import type { ReactNode } from 'react';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { supabase } from 'src/lib/supabase';
import { useAuth } from 'src/contexts/auth-context';

type Project = {
  id: string;
  name: string;
  logo_url: string | null;
  plan: string;
};

type ProjectContextType = {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loading: boolean;
  refreshProjects: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user?.id) {
      setProjects([]);
      setSelectedProjectState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, logo_url, plan')
        .order('name', { ascending: true });

      if (error) throw error;

      const sortedProjects = (data || []).sort((a, b) => a.name.localeCompare(b.name));
      setProjects(sortedProjects);

      const savedProjectId = localStorage.getItem('selectedProjectId');
      if (savedProjectId) {
        const savedProject = sortedProjects.find((p) => p.id === savedProjectId);
        if (savedProject) {
          setSelectedProjectState(savedProject);
          return;
        }
      }

      if (sortedProjects.length > 0) {
        setSelectedProjectState(sortedProjects[0]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const setSelectedProject = useCallback((project: Project | null) => {
    setSelectedProjectState(project);
    if (project) {
      localStorage.setItem('selectedProjectId', project.id);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }, []);

  const value = useMemo(
    () => ({
      projects,
      selectedProject,
      setSelectedProject,
      loading,
      refreshProjects: fetchProjects,
    }),
    [projects, selectedProject, setSelectedProject, loading, fetchProjects]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
