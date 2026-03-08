// ============================================================
// LeadPageApi.js
// Optimized API layer for Admin → Lead Management Page
// Uses /optimized backend routes
// ============================================================

import api from "./api"; // your axios instance


/* ============================================================
   FETCH FILTERED LEADS (OPTIMIZED)
============================================================ */
// Note: React Query passes an object context. We extract pageParam from it.
export const getOptimizedLeads = async ({ pageParam = 1, filters = {} }) => {
  try {
    const response = await api.get("/leads/admin/optimized/all", {
      params: {
        ...filters,
        page: pageParam,
        limit: 10, // Match backend pagination
      },
    });

    // Return the FULL response ({ success, data, total, totalPages }) 
    // so React Query can determine if there is a next page.
    return response.data; 
  } catch (error) {
    console.error("❌ Error fetching optimized leads:", error);
    throw error;
  }
};

/* ============================================================
   FETCH ONE LEAD BY ID (OPTIMIZED)
============================================================ */
export const getOptimizedLeadById = async (leadId) => {
    try {
        const response = await api.get(`/leads/admin/optimized/${leadId}`);
        return response.data.data;
    } catch (error) {
        console.error("❌ Error fetching optimized lead by ID:", error);
        throw error;
    }
};

/* ============================================================
   FETCH TEAM MEMBERS FOR ASSIGN FILTER (Optimized)
============================================================ */
export const getOptimizedTeamMembersForLeads = async () => {
    try {
        const response = await api.get("/team/optimized/filter");
        return response.data.data;
    } catch (error) {
        console.error("❌ Error fetching optimized team member list:", error);
        throw error;
    }
};

/* ============================================================
   ASSIGN LEAD TO TEAM MEMBER (Optimized)
============================================================ */
export const assignLeadOptimized = async (leadId, teamMemberId) => {
    try {
        const response = await api.put(
            `/leads/admin/optimized/${leadId}/assign`,
            { assignedTo: teamMemberId }
        );
        return response.data.data;
    } catch (error) {
        console.error("❌ Error assigning optimized lead:", error);
        throw error;
    }
};

/* ============================================================
   UPDATE LEAD STATUS (Optimized)
============================================================ */
export const updateLeadStatusOptimized = async (leadId, status) => {
    try {
        const response = await api.put(
            `/leads/admin/optimized/${leadId}/status`,
            { status }
        );
        return response.data.data;
    } catch (error) {
        console.error("❌ Error updating optimized lead status:", error);
        throw error;
    }
};

/* ============================================================
   UPDATE LEAD PRIORITY (Optimized)
============================================================ */
export const updateLeadPriorityOptimized = async (id, priority) => {
    try {
        const response = await api.put(
            `/leads/admin/optimized/${id}/priority`,
            { priority }
        );
        return response.data.data;
    } catch (error) {
        console.error("❌ Error updating priority:", error);
        throw error;
    }
};

/* ============================================================
   DELETE LEAD (Optimized)
============================================================ */
export const deleteLeadOptimized = async (leadId) => {
    try {
        const response = await api.delete(`/leads/admin/optimized/${leadId}`);
        return response.data.data;
    } catch (error) {
        console.error("❌ Error deleting optimized lead:", error);
        throw error;
    }
};

/* ============================================================
   FETCH LEAD STATS (Optimized)
============================================================ */
/*
export const getLeadStats = async (filters = {}) => {
    try {
        const response = await api.get("/leads/admin/stats", {
            params: filters,
        });
        return response.data.data;
    } catch (error) {
        console.error("❌ Error fetching lead stats:", error);
        return { total: 0, new: 0, contacted: 0, inProgress: 0, closed: 0 };
    }
};
*/
export const getLeadStats = async (filters = {}) => {
    try {
        const response = await api.get("/leads/admin/stats", {
            params: filters,
        });
        return response.data.data;
    } catch (error) {
        console.error("❌ Error fetching lead stats:", error);
        return { total: 0, new: 0, contacted: 0, inProgress: 0, closed: 0, noAnswer: 0 };
    }
};

/* ============================================================
   FETCH LEAD ACTIVITY TIMELINE
============================================================ */
export const getLeadActivity = async (leadId) => {
    try {
        const response = await api.get(`/leads/admin/optimized/${leadId}/activity`);
        return response.data.data;
    } catch (error) {
        console.error("❌ Error fetching lead activity:", error);
        throw error;
    }
};

/* ============================================================
   POST COMMENT TO LEAD TIMELINE
============================================================ */
export const postLeadComment = async (leadId, content) => {
    try {
        const response = await api.post(`/leads/admin/optimized/${leadId}/activity`, { content });
        return response.data.data;
    } catch (error) {
        console.error("❌ Error posting comment:", error);
        throw error;
    }
};
/* ============================================================
   BULK DELETE LEADS (Optimized)
   Supports { leadIds } OR { selectAll, filters, excludedIds }
============================================================ */
export const bulkDeleteLeads = async (payload) => {
    try {
        const response = await api.delete("/leads/admin/optimized/bulk", {
            data: payload
        });
        return response.data.data;
    } catch (error) {
        console.error("❌ Error bulk deleting leads:", error);
        throw error;
    }
};

/* ============================================================
   CREATE LEAD MANUALLY (Optimized)
============================================================ */
export const createLeadManually = async (leadData) => {
    try {
        const response = await api.post("/leads/admin/optimized", leadData);
        return response.data.data;
    } catch (error) {
        console.error("❌ Error creating lead:", error);
        throw error;
    }
};


/* ============================================================
   BULK ASSIGN LEADS (Optimized)
============================================================ */
export const bulkAssignLeads = async (payload) => {
    try {
        const response = await api.put("/leads/admin/optimized/bulk-assign", payload);
        return response.data.data;
    } catch (error) {
        console.error("❌ Error bulk assigning leads:", error);
        throw error;
    }
};


/* ============================================================
   UPDATE LEAD DETAILS (Optimized)
============================================================ */
export const updateLeadDetailsOptimized = async ({ leadId, updateData }) => {
    try {
        const response = await api.put(`/leads/admin/optimized/${leadId}/details`, updateData);
        return response.data.data;
    } catch (error) {
        console.error("❌ Error updating lead details:", error);
        throw error;
    }
};