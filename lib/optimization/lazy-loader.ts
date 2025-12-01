// lib/optimization/lazy-loader.ts
import dynamic from 'next/dynamic';

export class LazyLoader {
  private static instance: LazyLoader;
  private loadedModules: Map<string, any> = new Map();

  static getInstance(): LazyLoader {
    if (!LazyLoader.instance) {
      LazyLoader.instance = new LazyLoader();
    }
    return LazyLoader.instance;
  }

  /**
   * Load portal-specific components dynamically
   */
  async loadPortalComponents(portalId: string) {
    if (this.loadedModules.has(portalId)) {
      return this.loadedModules.get(portalId);
    }

    const components = {
      card: dynamic(() => import(`@/components/portals/portal-card`)),
      session: dynamic(() => import(`@/components/portals/portal-session`)),
      progress: dynamic(() => import(`@/components/portals/portal-progress`))
    };

    this.loadedModules.set(portalId, components);
    return components;
  }

  /**
   * Preload critical assets
   */
  async preloadCriticalAssets() {
    // Preload fonts
    const fonts = [
      '/fonts/inter-var.woff2',
      '/fonts/space-grotesk.woff2'
    ];

    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = font;
      document.head.appendChild(link);
    });

    // Preload hero images
    const images = [
      '/images/portal-p0-hero.jpg',
      '/images/portal-p1-hero.jpg'
    ];

    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  /**
   * Load biometric modules
   */
  async loadBiometricModules() {
    if (this.loadedModules.has('biometric')) {
      return this.loadedModules.get('biometric');
    }

    const modules = {
      scanner: dynamic(() => import('@/components/biometric/biometric-scanner')),
      display: dynamic(() => import('@/components/biometric/emotion-display')),
      privacy: dynamic(() => import('@/components/biometric/privacy-dashboard'))
    };

    this.loadedModules.set('biometric', modules);
    return modules;
  }

  /**
   * Load Quantum Vault assets
   */
  async loadQuantumVaultAssets() {
    if (this.loadedModules.has('quantum')) {
      return this.loadedModules.get('quantum');
    }

    const modules = {
      timeline3d: dynamic(() => import('@/components/quantum/timeline-3d')),
      memoryNode: dynamic(() => import('@/components/quantum/memory-node')),
      simulator: dynamic(() => import('@/components/quantum/future-simulator'))
    };

    this.loadedModules.set('quantum', modules);
    return modules;
  }

  /**
   * Optimize image loading
   */
  async optimizeImageLoading() {
    // Use Intersection Observer to lazy load images
    const images = document.querySelectorAll('img[data-lazy]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.lazy || '';
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => observer.observe(img));
  }

  /**
   * Implement service worker for offline support
   */
  async implementServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
}

export const lazyLoader = LazyLoader.getInstance();