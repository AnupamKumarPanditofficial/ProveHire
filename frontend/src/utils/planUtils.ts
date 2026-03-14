/**
 * Subscription Plan Features
 */
export const PLAN_FEATURES = {
    Free: {
        aiResume: false,
        proTag: false,
        unlimitedApplications: false,
        directChat: false,
        weeklyAppLimit: 1
    },
    Basic: {
        aiResume: true,
        proTag: true,
        unlimitedApplications: false,
        directChat: false,
        weeklyAppLimit: 5
    },
    Pro: {
        aiResume: true,
        proTag: true,
        unlimitedApplications: true,
        directChat: true,
        weeklyAppLimit: Infinity
    },
    Elite: {
        aiResume: true,
        proTag: true,
        unlimitedApplications: true,
        directChat: true,
        weeklyAppLimit: Infinity
    }
};

/**
 * Check if a user has access to a specific feature
 */
export const hasFeature = (user: any, feature: keyof typeof PLAN_FEATURES.Free): boolean | number => {
    const plan = (user?.subscriptionPlan || 'Free') as keyof typeof PLAN_FEATURES;
    const features = PLAN_FEATURES[plan] || PLAN_FEATURES.Free;
    return features[feature];
};
