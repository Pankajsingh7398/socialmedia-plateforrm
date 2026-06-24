import { api } from '../api.js';
import { escapeHtml } from '../utils.js';

export const renderAdminPage = () => `
  <div class="page-container-full">
    <h1 style="font-weight:800;margin-bottom:1.5rem">Admin Dashboard</h1>
    <div id="admin-content"><div class="skeleton skeleton-card" style="height:200px"></div></div>
  </div>
`;

export const loadAdmin = async () => {
  const container = document.getElementById('admin-content');
  try {
    const data = await api.get('/admin/stats');
    container.innerHTML = `
      <div class="dashboard-stats" style="margin-bottom:2rem">
        <div class="stat-card-premium"><div class="stat-value">${data.stats.users}</div><div class="stat-label">Users</div></div>
        <div class="stat-card-premium"><div class="stat-value">${data.stats.posts}</div><div class="stat-label">Posts</div></div>
        <div class="stat-card-premium"><div class="stat-value">${data.stats.reels}</div><div class="stat-label">Reels</div></div>
        <div class="stat-card-premium"><div class="stat-value">${data.stats.pendingReports}</div><div class="stat-label">Reports</div></div>
      </div>
      <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
        <div class="widget glass-card">
          <h3 class="widget-title">Recent Users</h3>
          ${data.recentUsers?.map((u) => `<div style="padding:0.5rem 0;border-bottom:1px solid var(--border);font-size:0.875rem"><strong>${escapeHtml(u.name)}</strong> @${escapeHtml(u.username)} <span class="text-muted">${u.role}</span></div>`).join('') || ''}
        </div>
        <div class="widget glass-card">
          <h3 class="widget-title">Pending Reports</h3>
          ${data.pendingReports?.map((r) => `<div style="padding:0.5rem 0;border-bottom:1px solid var(--border);font-size:0.875rem;display:flex;justify-content:space-between"><span>${r.targetType}: ${escapeHtml(r.reason)}</span><button class="btn btn-sm btn-secondary" data-action="resolve-report" data-id="${r._id}">Resolve</button></div>`).join('') || '<p class="text-muted">No pending reports</p>'}
        </div>
      </div>
    `;
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Admin access required</p></div>';
  }
};
