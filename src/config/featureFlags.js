/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for the AI Engagement Hub.
 * Features can be toggled via environment variables or dynamically based on user roles.
 *
 * Naming Convention: REACT_APP_FEATURE_[FEATURE_NAME]
 */

// Helper function to parse boolean environment variables
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  return value.toLowerCase() === 'true';
};

// Feature flag definitions
const FEATURE_FLAGS = {
  // Core Features (always enabled)
  CORE: {
    AI_CHAT: true,
    COURSE_MANAGEMENT: true,
    PROJECT_MANAGEMENT: true,
    AUTHENTICATION: true,
  },

  // Enhancement Features
  ENHANCEMENTS: {
    EMAIL_NOTIFICATIONS: parseBoolean(process.env.REACT_APP_FEATURE_EMAIL_NOTIFICATIONS, true),
    ADVANCED_ANALYTICS: parseBoolean(process.env.REACT_APP_FEATURE_ADVANCED_ANALYTICS, false),
    BULK_OPERATIONS: parseBoolean(process.env.REACT_APP_FEATURE_BULK_OPERATIONS, false),
    EXPORT_IMPORT: parseBoolean(process.env.REACT_APP_FEATURE_EXPORT_IMPORT, false),
  },

  // Experimental Features (opt-in)
  EXPERIMENTAL: {
    BETA_AI_MODELS: parseBoolean(process.env.REACT_APP_FEATURE_BETA_AI_MODELS, false),
    AI_WRITING_COACH: parseBoolean(process.env.REACT_APP_FEATURE_AI_WRITING_COACH, false),
    PEER_COLLABORATION: parseBoolean(process.env.REACT_APP_FEATURE_PEER_COLLABORATION, false),
    VOICE_INTERFACE: parseBoolean(process.env.REACT_APP_FEATURE_VOICE_INTERFACE, false),
  },

  // Nice-to-Have Features
  NICE_TO_HAVE: {
    DARK_MODE: parseBoolean(process.env.REACT_APP_FEATURE_DARK_MODE, false),
    CUSTOM_THEMES: parseBoolean(process.env.REACT_APP_FEATURE_CUSTOM_THEMES, false),
    ANIMATIONS: parseBoolean(process.env.REACT_APP_FEATURE_ANIMATIONS, true),
    TOOLTIPS: parseBoolean(process.env.REACT_APP_FEATURE_TOOLTIPS, true),
  },

  // Debug/Development Features
  DEBUG: {
    SHOW_IDS: parseBoolean(process.env.REACT_APP_FEATURE_SHOW_IDS, false),
    API_LOGS: parseBoolean(process.env.REACT_APP_FEATURE_API_LOGS, false),
    PERFORMANCE_MONITOR: parseBoolean(process.env.REACT_APP_FEATURE_PERFORMANCE_MONITOR, false),
  },
};

/**
 * Feature flag service with role-based and course-based overrides
 */
class FeatureFlagService {
  constructor() {
    this.flags = FEATURE_FLAGS;
    this.overrides = {};
    this.userRole = null;
    this.courseId = null;
    this.experimentalOptIn = new Set();
  }

  /**
   * Set current user context for dynamic feature flags
   */
  setUserContext(userRole, courseId = null) {
    this.userRole = userRole;
    this.courseId = courseId;
  }

  /**
   * Check if a feature is enabled
   * @param {string} category - Feature category (CORE, ENHANCEMENTS, EXPERIMENTAL, etc.)
   * @param {string} feature - Feature name
   * @returns {boolean}
   */
  isEnabled(category, feature) {
    // Check for override first
    const overrideKey = `${category}.${feature}`;
    if (this.overrides[overrideKey] !== undefined) {
      return this.overrides[overrideKey];
    }

    // Check category
    if (!this.flags[category]) {
      console.warn(`Unknown feature category: ${category}`);
      return false;
    }

    // Check feature
    if (this.flags[category][feature] === undefined) {
      console.warn(`Unknown feature: ${category}.${feature}`);
      return false;
    }

    // Apply role-based rules
    if (category === 'EXPERIMENTAL') {
      // Only instructors and admins can access experimental features
      if (this.userRole && !['instructor', 'admin', 'school_admin'].includes(this.userRole)) {
        return false;
      }
      // Check if user has opted into this experiment
      if (!this.experimentalOptIn.has(feature)) {
        return false;
      }
    }

    // Apply course-specific rules
    if (this.courseId && this.getCourseOverrides(this.courseId)[overrideKey] !== undefined) {
      return this.getCourseOverrides(this.courseId)[overrideKey];
    }

    return this.flags[category][feature];
  }

  /**
   * Set a temporary override for a feature (useful for testing)
   */
  setOverride(category, feature, value) {
    this.overrides[`${category}.${feature}`] = value;
  }

  /**
   * Clear all overrides
   */
  clearOverrides() {
    this.overrides = {};
  }

  /**
   * Get course-specific feature overrides
   * This could be fetched from Firebase in the future
   */
  getCourseOverrides(courseId) {
    // Placeholder for course-specific overrides
    // In the future, this could be stored in Firebase
    return {};
  }

  /**
   * Opt into an experimental feature
   */
  optInToExperiment(feature) {
    this.experimentalOptIn.add(feature);
  }

  /**
   * Opt out of an experimental feature
   */
  optOutOfExperiment(feature) {
    this.experimentalOptIn.delete(feature);
  }

  /**
   * Get all enabled features for current context
   */
  getEnabledFeatures() {
    const enabled = {};

    Object.keys(this.flags).forEach(category => {
      enabled[category] = {};
      Object.keys(this.flags[category]).forEach(feature => {
        if (this.isEnabled(category, feature)) {
          enabled[category][feature] = true;
        }
      });
    });

    return enabled;
  }

  /**
   * Get feature statistics for admin dashboard
   */
  getFeatureStats() {
    let total = 0;
    let enabled = 0;
    let experimental = 0;

    Object.keys(this.flags).forEach(category => {
      Object.keys(this.flags[category]).forEach(feature => {
        total++;
        if (this.isEnabled(category, feature)) {
          enabled++;
          if (category === 'EXPERIMENTAL') {
            experimental++;
          }
        }
      });
    });

    return {
      total,
      enabled,
      disabled: total - enabled,
      experimental,
      categories: Object.keys(this.flags).length,
    };
  }
}

// Create singleton instance
const featureFlags = new FeatureFlagService();

// Convenience functions for common checks
export const isFeatureEnabled = (category, feature) => featureFlags.isEnabled(category, feature);
export const isExperimentalFeature = (feature) => featureFlags.isEnabled('EXPERIMENTAL', feature);
export const isEnhancementEnabled = (feature) => featureFlags.isEnabled('ENHANCEMENTS', feature);
export const isDebugEnabled = (feature) => featureFlags.isEnabled('DEBUG', feature);

// React hook for feature flags
export const useFeatureFlag = (category, feature) => {
  return featureFlags.isEnabled(category, feature);
};

// HOC for conditionally rendering components based on feature flags
export const withFeatureFlag = (category, feature) => (Component) => {
  return (props) => {
    if (!featureFlags.isEnabled(category, feature)) {
      return null;
    }
    return <Component {...props} />;
  };
};

// Component for feature flag gating
export const FeatureGate = ({ category, feature, children, fallback = null }) => {
  if (!featureFlags.isEnabled(category, feature)) {
    return fallback;
  }
  return children;
};

export default featureFlags;