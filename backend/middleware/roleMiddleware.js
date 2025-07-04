
const { AppError } = require('../utils/errorHandler');

/**
 * Role-based access control middleware
 * @param {Array} allowedRoles - Array of roles that can access the route
 * @returns {Function} Middleware function
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Resource ownership middleware for agents
 * Ensures agents can only access their assigned resources
 */
const resourceOwnershipMiddleware = (resourceIdParam = 'id', ownerField = 'assignedAgentId') => {
  return async (req, res, next) => {
    try {
      // Skip for super admin and manager
      if (['super_admin', 'manager'].includes(req.user.role)) {
        return next();
      }

      // For agents, add ownership filter
      if (req.user.role === 'agent') {
        // Add filter to query params for GET requests
        if (req.method === 'GET') {
          req.ownershipFilter = { [ownerField]: req.user._id };
        }
        
        // For other methods, we'll check ownership in the controller
        req.checkOwnership = true;
        req.ownerField = ownerField;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Client access middleware
 * Specialized middleware for client-related operations
 */
const clientAccessMiddleware = (req, res, next) => {
  try {
    // Set up role-based filters
    switch (req.user.role) {
      case 'super_admin':
        // Super admin can access all clients
        break;
        
      case 'manager':
        // Manager can access all clients in their region/team
        // This would require additional user model fields for team/region
        break;
        
      case 'agent':
        // Agent can only access assigned clients
        req.agentFilter = { assignedAgentId: req.user._id };
        break;
        
      default:
        throw new AppError('Invalid user role', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  roleMiddleware,
  resourceOwnershipMiddleware,
  clientAccessMiddleware
};
