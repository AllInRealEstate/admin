// src/services/LeadStatsApi.js
// Lead Statistics API for Admin Performance

import api from "./api";

/**
 * Get Lead Statistics for Admin (based on their linked worker ID)
 * This shows the admin's performance metrics
 * 
 * @param {string} workerId - The worker ID linked to the admin
 * @returns {Object} - { currentClients, dealsInProgress, propertiesSold }
 */
export const getAdminLeadStats = async (workerId) => {
  if (!workerId) {
    return {
      currentClients: 0,
      dealsInProgress: 0,
      propertiesSold: 0
    };
  }

  try {
    // Use existing stats endpoint with assignedTo filter
    const response = await api.get("/leads/admin/stats", {
      params: {
        assignedTo: workerId,
        view: "all"
      }
    });

    const data = response.data.data;

    // Transform backend stats to performance metrics:
    // 1. Current Clients = Total leads assigned to this admin
    // 2. Deals in Progress = Contacted + InProgress (not "new" or "closed")
    // 3. Properties Sold = Closed deals
    return {
      currentClients: data.total || 0,
      dealsInProgress: (data.contacted || 0) + (data.inProgress || 0),
      propertiesSold: data.closed || 0
    };
  } catch (error) {
    console.error("Error fetching admin lead stats:", error);
    
    // Return zeros on error to prevent UI breaking
    return {
      currentClients: 0,
      dealsInProgress: 0,
      propertiesSold: 0
    };
  }
};

/**
 * Get Global Platform Statistics for Super Admins
 * @returns {Object} - { superAdminCount, connectedAdmins, totalLeads, leadsToday }
 */
export const getGlobalPlatformStats = async () => {
  try {
    const response = await api.get("/leads/platform/stats");
    const data = response.data.data;

    return {
      superAdminCount: data.superAdmins || 0,
      connectedAdmins: data.admins || 0,
      totalLeads: data.totalLeads || 0,
      leadsToday: data.newToday || 0
    };
  } catch (error) {
    console.error("Error fetching global platform stats:", error);
    return {
      superAdminCount: 0,
      connectedAdmins: 0,
      totalLeads: 0,
      leadsToday: 0
    };
  }
};