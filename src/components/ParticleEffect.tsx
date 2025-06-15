import React, { useEffect, useRef, useState } from 'react';
import { PARTICLE_SETTINGS, getDeviceType, getParticleSettings } from '@/lib/particleConfig';

interface Particle {
    x: number;
    y: number;
    size: number;
    color: string;
    velocity: {
        x: number;
        y: number;
    };
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    scale: number;
    life: number;
    maxLife: number;
}

interface ParticleEffectProps {
    x: number;
    y: number;
    color: string;
    count?: number;
    size?: number;
    duration?: number;
    intensity?: number;
    glow?: boolean;
}

const ParticleEffect: React.FC<ParticleEffectProps> = ({
    x,
    y,
    color,
    count,
    size,
    duration,
    intensity,
    glow = false,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number>();
    const startTimeRef = useRef<number>(0);
    const scaleRef = useRef<{ x: number; y: number }>({ x: 1, y: 1 });
    const [deviceSettings, setDeviceSettings] = useState(getParticleSettings());
    const isMobileRef = useRef(false);

    // Initialize particles
    useEffect(() => {
        // Check if device is mobile
        const checkDevice = () => {
            const width = window.innerWidth;
            isMobileRef.current = width < 768; // Mobile devices are below 768px
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);

        // If mobile device, don't initialize particles
        if (isMobileRef.current) {
            return () => {
                window.removeEventListener('resize', checkDevice);
            };
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match parent and calculate scale
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            // Get the game canvas dimensions
            const gameCanvas = document.querySelector('canvas');
            if (!gameCanvas) return;

            // Set canvas size to match parent
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;

            // Calculate scale factors
            scaleRef.current = {
                x: canvas.width / gameCanvas.width,
                y: canvas.height / gameCanvas.height
            };
        };
        resizeCanvas();

        // Get current device settings
        const currentSettings = getParticleSettings();
        setDeviceSettings(currentSettings);

        // Use provided props or fall back to device settings
        const finalCount = count ?? currentSettings.count;
        const finalSize = size ?? currentSettings.size;
        const finalDuration = duration ?? currentSettings.duration;
        const finalIntensity = intensity ?? currentSettings.intensity;

        // Create particles with scaled coordinates
        const particles: Particle[] = [];
        const scaledX = x * scaleRef.current.x;
        const scaledY = y * scaleRef.current.y;
        const scaledSize = finalSize * Math.min(scaleRef.current.x, scaleRef.current.y);

        for (let i = 0; i < finalCount; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = (Math.random() * 2 + 1) * finalIntensity * Math.min(scaleRef.current.x, scaleRef.current.y);
            particles.push({
                x: scaledX,
                y: scaledY,
                size: scaledSize * (Math.random() * 0.5 + 0.75),
                color,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed,
                },
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                opacity: 1,
                scale: 1,
                life: 0,
                maxLife: finalDuration,
            });
        }
        particlesRef.current = particles;
        startTimeRef.current = performance.now();

        // Animation loop
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTimeRef.current;
            const progress = Math.min(elapsed / finalDuration, 1);

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particlesRef.current = particlesRef.current.filter(particle => {
                // Update particle
                particle.x += particle.velocity.x;
                particle.y += particle.velocity.y;
                particle.rotation += particle.rotationSpeed;
                particle.life = elapsed;
                particle.opacity = 1 - progress;
                particle.scale = 1 - progress * 0.5;

                // Draw particle
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                ctx.scale(particle.scale, particle.scale);

                // Draw particle shape (triangle)
                ctx.beginPath();
                ctx.moveTo(0, -particle.size);
                ctx.lineTo(particle.size, particle.size);
                ctx.lineTo(-particle.size, particle.size);
                ctx.closePath();

                // Add glow effect if enabled
                if (glow) {
                    ctx.shadowColor = particle.color;
                    ctx.shadowBlur = currentSettings.glowIntensity * Math.min(scaleRef.current.x, scaleRef.current.y);
                }

                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.opacity;
                ctx.fill();
                ctx.restore();

                return particle.life < particle.maxLife;
            });

            // Continue animation if particles remain
            if (particlesRef.current.length > 0) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        // Start animation
        animationFrameRef.current = requestAnimationFrame(animate);

        // Add resize listener
        const handleResize = () => {
            checkDevice();
            if (isMobileRef.current) {
                // Clean up animation if switching to mobile
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                return;
            }

            resizeCanvas();
            const newSettings = getParticleSettings();
            setDeviceSettings(newSettings);

            // Update existing particles with new scale
            particlesRef.current.forEach(particle => {
                particle.size *= Math.min(scaleRef.current.x, scaleRef.current.y);
                particle.velocity.x *= scaleRef.current.x;
                particle.velocity.y *= scaleRef.current.y;
            });
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('resize', checkDevice);
        };
    }, [x, y, color, count, size, duration, intensity, glow]);

    // Don't render canvas for mobile devices
    if (isMobileRef.current) {
        return null;
    }

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 50,
                touchAction: 'none',
            }}
        />
    );
};

export default ParticleEffect; 