/**
 * Portfolio Website - Interactive JavaScript
 * Handles: Navigation, Scroll animations, Collapsible panels, Lightbox, Lazy loading
 */

(function() {
    'use strict';

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        nav: document.querySelector('.nav'),
        navToggle: document.querySelector('.nav-toggle'),
        navLinks: document.querySelector('.nav-links'),
        modal: document.getElementById('projectModal'),
        modalOverlay: document.querySelector('.modal-overlay'),
        modalClose: document.querySelector('.modal-close'),
        modalTitle: document.getElementById('modalTitle'),
        galleryTrack: document.querySelector('.gallery-track'),
        galleryDots: document.querySelector('.gallery-dots'),
        galleryPrev: document.querySelector('.gallery-prev'),
        galleryNext: document.querySelector('.gallery-next'),
        projectPanels: document.querySelectorAll('.project-panel'),
        fadeElements: document.querySelectorAll('.fade-in')
    };

    // ========================================
    // State
    // ========================================
    let currentGalleryIndex = 0;
    let currentGalleryItems = [];

    // ========================================
    // Navigation
    // ========================================
    function initNavigation() {
        // Mobile toggle
        elements.navToggle.addEventListener('click', () => {
            elements.navToggle.classList.toggle('active');
            elements.navLinks.classList.toggle('active');
            const isExpanded = elements.navLinks.classList.contains('active');
            elements.navToggle.setAttribute('aria-expanded', isExpanded);
        });

        // Close mobile nav on link click
        elements.navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                elements.navToggle.classList.remove('active');
                elements.navLinks.classList.remove('active');
                elements.navToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const navHeight = elements.nav.offsetHeight;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ========================================
    // Collapsible Project Panels
    // ========================================
    function initCollapsiblePanels() {
        elements.projectPanels.forEach(panel => {
            const headerBtn = panel.querySelector('.project-header-btn');

            headerBtn.addEventListener('click', () => {
                const isExpanded = panel.classList.contains('expanded');

                // Toggle this panel
                panel.classList.toggle('expanded');
                headerBtn.setAttribute('aria-expanded', !isExpanded);
            });

            // Keyboard accessibility
            headerBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    headerBtn.click();
                }
            });
        });
    }

    // ========================================
    // Intersection Observer for Fade-in
    // ========================================
    function initScrollAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        elements.fadeElements.forEach(el => observer.observe(el));
    }

    // ========================================
    // Lightbox for Gallery Items
    // ========================================
    function openLightbox(galleryItems, startIndex) {
        currentGalleryItems = galleryItems;
        currentGalleryIndex = startIndex;

        // Build gallery
        buildGallery();

        // Show modal
        elements.modal.classList.add('active');
        elements.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus trap
        elements.modalClose.focus();
    }

    function closeLightbox() {
        elements.modal.classList.remove('active');
        elements.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        // Stop all videos
        const videos = elements.galleryTrack.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
        });
    }

    function buildGallery() {
        const media = currentGalleryItems;

        // Build gallery items
        elements.galleryTrack.innerHTML = media.map((item, index) => {
            if (item.type === 'video') {
                return `
                    <div class="gallery-item" data-index="${index}">
                        <video controls preload="metadata" aria-label="Video ${index + 1}">
                            <source src="${item.src}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                `;
            }
            return `
                <div class="gallery-item" data-index="${index}">
                    <img src="${item.src}" alt="Image ${index + 1}" loading="lazy">
                </div>
            `;
        }).join('');

        // Build dots
        elements.galleryDots.innerHTML = media.map((_, index) =>
            `<button class="gallery-dot ${index === currentGalleryIndex ? 'active' : ''}" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>`
        ).join('');

        // Update gallery position
        updateGalleryPosition();
    }

    function updateGalleryPosition() {
        elements.galleryTrack.style.transform = `translateX(-${currentGalleryIndex * 100}%)`;

        // Update dots
        elements.galleryDots.querySelectorAll('.gallery-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentGalleryIndex);
        });

        // Pause all videos except current
        const videos = elements.galleryTrack.querySelectorAll('video');
        videos.forEach((video, index) => {
            if (index !== currentGalleryIndex) {
                video.pause();
            }
        });
    }

    function nextSlide() {
        currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryItems.length;
        updateGalleryPosition();
    }

    function prevSlide() {
        currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
        updateGalleryPosition();
    }

    function goToSlide(index) {
        currentGalleryIndex = index;
        updateGalleryPosition();
    }

    function initLightbox() {
        // Gallery item clicks within project panels
        document.querySelectorAll('.gallery-grid .gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                // Find all items in this gallery
                const galleryGrid = item.closest('.gallery-grid');
                const items = galleryGrid.querySelectorAll('.gallery-item');

                // Build media array
                const galleryItems = Array.from(items).map(el => ({
                    src: el.dataset.src,
                    type: el.dataset.type || 'image'
                }));

                // Find index of clicked item
                const index = Array.from(items).indexOf(item);

                openLightbox(galleryItems, index);
            });

            // Keyboard accessibility
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
            item.setAttribute('aria-label', 'View full size');
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });

        // Close modal
        elements.modalClose.addEventListener('click', closeLightbox);
        elements.modalOverlay.addEventListener('click', closeLightbox);

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
                closeLightbox();
            }
        });

        // Gallery navigation
        elements.galleryNext.addEventListener('click', nextSlide);
        elements.galleryPrev.addEventListener('click', prevSlide);

        // Gallery dots
        elements.galleryDots.addEventListener('click', (e) => {
            if (e.target.classList.contains('gallery-dot')) {
                goToSlide(parseInt(e.target.dataset.index, 10));
            }
        });

        // Keyboard navigation for gallery
        document.addEventListener('keydown', (e) => {
            if (!elements.modal.classList.contains('active')) return;
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        });

        // Touch/swipe support for gallery
        let touchStartX = 0;
        let touchEndX = 0;

        elements.galleryTrack.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        elements.galleryTrack.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        }
    }

    // ========================================
    // Video Hover Preview
    // ========================================
    function initVideoPreview() {
        document.querySelectorAll('.gallery-grid .video-item').forEach(item => {
            const video = item.querySelector('video');
            if (!video) return;

            item.addEventListener('mouseenter', () => {
                video.play().catch(() => {});
            });

            item.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
        });
    }

    // ========================================
    // Lazy Loading Enhancement
    // ========================================
    function initLazyLoading() {
        // Native lazy loading is used via HTML attribute
        // This adds Intersection Observer fallback for older browsers
        if ('loading' in HTMLImageElement.prototype) {
            return; // Native lazy loading supported
        }

        const images = document.querySelectorAll('img[loading="lazy"]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // ========================================
    // Active Navigation Highlight
    // ========================================
    function initActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navHeight = elements.nav.offsetHeight;

        function highlightNav() {
            const scrollY = window.pageYOffset;

            sections.forEach(section => {
                const sectionTop = section.offsetTop - navHeight - 100;
                const sectionBottom = sectionTop + section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollY >= sectionTop && scrollY < sectionBottom) {
                    elements.navLinks.querySelectorAll('a').forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }

        window.addEventListener('scroll', throttle(highlightNav, 100), { passive: true });
    }

    // ========================================
    // Utility Functions
    // ========================================
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ========================================
    // Theme Toggle
    // ========================================
    function initThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        const html = document.documentElement;

        // Check for saved theme preference or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        html.setAttribute('data-theme', savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // ========================================
    // Initialize
    // ========================================
    function init() {
        initThemeToggle();
        initNavigation();
        initCollapsiblePanels();
        initScrollAnimations();
        initLightbox();
        initVideoPreview();
        initLazyLoading();
        initActiveNav();

        // Trigger initial fade-in for visible elements
        setTimeout(() => {
            elements.fadeElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight) {
                    el.classList.add('visible');
                }
            });
        }, 100);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
