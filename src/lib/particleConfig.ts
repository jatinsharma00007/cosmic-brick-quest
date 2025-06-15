interface ParticleDeviceSettings {
    size: number;
    count: number;
    duration: number;
    intensity: number;
    glowIntensity: number;
}

interface ParticleSettings {
    desktop: ParticleDeviceSettings;
    tablet: ParticleDeviceSettings;
    mobile: ParticleDeviceSettings;
}

export const PARTICLE_SETTINGS: ParticleSettings = {
    desktop: {
        size: 4,
        count: 12,
        duration: 1200,
        intensity: 1,
        glowIntensity: 10
    },
    tablet: {
        size: 3.5,
        count: 10,
        duration: 1100,
        intensity: 0.9,
        glowIntensity: 8
    },
    mobile: {
        size: 1,
        count: 5,
        duration: 800,
        intensity: 0.5,
        glowIntensity: 3
    }
};

// Helper function to get device type based on screen width
export const getDeviceType = (width: number): keyof ParticleSettings => {
    if (width >= 1024) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
};

// Helper function to get particle settings for current device
export const getParticleSettings = (): ParticleDeviceSettings => {
    const width = window.innerWidth;
    return PARTICLE_SETTINGS[getDeviceType(width)];
}; 