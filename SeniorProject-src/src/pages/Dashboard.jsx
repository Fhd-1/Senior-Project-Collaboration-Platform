import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import ProjectCard from "../components/ProjectCard";
import CreateProjectModal from "../components/CreateProjectModal";
import EditProjectModal from "../components/EditProjectModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

import {
  createProject,
  getUserProjects,
  leaveProject,
  updateProject,
  deleteProject,
} from "../services/firestoreService";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadProjects = async () => {
    const data = await getUserProjects();
    setProjects(data);
  };

  const handleCreateProject = async (project) => {
    await createProject(project);
    await loadProjects();
  };

  const handleLeave = async (projectId) => {
    await leaveProject(projectId);
    await loadProjects();
  };

  const handleEdit = (project) => {
    setEditingProject(project);
  };

  const handleUpdate = async (id, updates) => {
    await updateProject(id, updates);
    await loadProjects();
  };

  const handleDelete = async (projectId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this project?"
    );
    if (!confirm) return;
    await deleteProject(projectId);
    await loadProjects();
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <DashboardLayout>
      <h2 style={{ marginBottom: "1.5rem" }}>Your Projects</h2>
      <div style={grid}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            title={project.name}
            description={project.description}
            deadline={project.deadline}
            isCreator={user?.uid === project.creator}
            onClick={() => navigate(`/project/${project.id}`)}
            onEdit={() => handleEdit(project)}
            onDelete={() => handleDelete(project.id)}
            onLeave={() => handleLeave(project.id)}
          />
        ))}
        <ProjectCard isCreate onClick={() => setShowCreate(true)} />
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateProject}
        />
      )}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={handleUpdate}
        />
      )}
    </DashboardLayout>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: "1.75rem",
};
