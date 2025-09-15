const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique tenant ID
 * @returns {string} A unique tenant identifier
 */
function generateTenantId() {
    const timestamp = Date.now().toString(36);
    const randomId = uuidv4().replace(/-/g, '').substring(0, 8);
    return `tenant_${timestamp}_${randomId}`;
}

/**
 * Create a MongoDB filter object that includes tenant isolation
 * @param {string} tenantId - The tenant ID to filter by
 * @param {Object} additionalFilters - Additional filters to apply
 * @returns {Object} MongoDB filter object
 */
function createTenantFilter(tenantId, additionalFilters = {}) {
    return {
        tenant_id: tenantId,
        ...additionalFilters
    };
}

/**
 * Add tenant ID to a data object
 * @param {Object} data - The data object to modify
 * @param {string} tenantId - The tenant ID to add
 * @returns {Object} Modified data object with tenant_id
 */
function addTenantId(data, tenantId) {
    return {
        ...data,
        tenant_id: tenantId
    };
}

/**
 * Validate tenant ID format
 * @param {string} tenantId - The tenant ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateTenantId(tenantId) {
    if (!tenantId || typeof tenantId !== 'string') {
        return false;
    }
    return tenantId.startsWith('tenant_') && tenantId.length > 10;
}

/**
 * Middleware to ensure tenant isolation in routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function tenantMiddleware(req, res, next) {
    // Extract tenant_id from JWT token
    if (req.user && req.user.tenant_id) {
        req.tenant_id = req.user.tenant_id;
        next();
    } else if (req.user && req.user.role === 'SuperAdmin') {
        // SuperAdmin can access all tenants
        req.tenant_id = null;
        next();
    } else {
        return res.status(403).json({
            message: "Access denied: No valid tenant ID found"
        });
    }
}

module.exports = {
    generateTenantId,
    createTenantFilter,
    addTenantId,
    validateTenantId,
    tenantMiddleware
};