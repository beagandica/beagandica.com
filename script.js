// ===== Navigation Toggle =====
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle?.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close menu when clicking a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// ===== Navbar Scroll Effect =====
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Fade In Animation on Scroll =====
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeInObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Add fade-in class to elements
document.querySelectorAll('.section-header, .about-text, .award-card, .topic-card, .stat-card, .nuevo-text').forEach(el => {
    el.classList.add('fade-in');
    fadeInObserver.observe(el);
});

// ===== Form Handling with Email Validation =====
const contactForm = document.getElementById('contact-form');

contactForm?.addEventListener('submit', function(e) {
    const emailInput = this.querySelector('#email');
    const email = emailInput.value.trim();
    
    // Email validation regex - checks for valid format with common domains
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|mil|co|io|ai|tech|info|biz|us|uk|ca|mx|es|de|fr|br|ar|cl|ve|co\.uk|com\.mx|com\.ar)$/i;
    
    if (!emailRegex.test(email)) {
        e.preventDefault();
        
        // Show error message
        let errorMsg = emailInput.parentElement.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('span');
            errorMsg.className = 'error-message';
            emailInput.parentElement.appendChild(errorMsg);
        }
        errorMsg.textContent = 'Please enter a valid email address (e.g., name@gmail.com)';
        emailInput.classList.add('input-error');
        emailInput.focus();
        return false;
    }
    
    // Clear any previous errors
    const errorMsg = emailInput.parentElement.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
    emailInput.classList.remove('input-error');
    
    // Show sending state
    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;
});

// Clear error on input
document.getElementById('email')?.addEventListener('input', function() {
    this.classList.remove('input-error');
    const errorMsg = this.parentElement.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
});

// Newsletter form
const newsletterForm = document.querySelector('.newsletter-form');

newsletterForm?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const btn = this.querySelector('button');
    const input = this.querySelector('input');
    const originalText = btn.textContent;
    
    btn.textContent = 'Subscribing...';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.textContent = 'Subscribed! ✓';
        input.value = '';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 3000);
    }, 1000);
});

// ===== Counter Animation =====
const counters = document.querySelectorAll('.highlight-number, .stat-number');

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(counter => counterObserver.observe(counter));

function animateCounter(element) {
    const text = element.textContent;
    const hasPlus = text.includes('+');
    const number = parseInt(text.replace(/[^0-9]/g, ''));
    
    if (isNaN(number)) return;
    
    let current = 0;
    const increment = number / 50;
    const duration = 1500;
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= number) {
            element.textContent = number.toLocaleString() + (hasPlus ? '+' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString() + (hasPlus ? '+' : '');
        }
    }, stepTime);
}

// ===== Parallax Effect on Hero =====
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    const scrolled = window.pageYOffset;
    
    if (hero && scrolled < window.innerHeight) {
        hero.style.backgroundPositionY = scrolled * 0.5 + 'px';
    }
});

// ===== Active Navigation Link =====
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

console.log('🚀 Beatris Mendez Gandica - Website loaded successfully!');
