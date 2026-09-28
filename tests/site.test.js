const assert = require('node:assert/strict');
const { readFileSync, existsSync, statSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const source = readFileSync(path.join(root, 'translations.js'), 'utf8');
const translations = JSON.parse(vm.runInNewContext(`${source}\nJSON.stringify(translations)`));
const tags = [...html.matchAll(/<[a-z][^>]*>/gi)].map(match => match[0]);

function attributes(tag) {
    return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)]
        .map(([, name, value]) => [name, value]));
}

function normalize(value) {
    return value.replace(/&copy;/g, '\u00a9').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

test('English and Spanish cover every translation, including labels and image descriptions', () => {
    assert.deepEqual(Object.keys(translations.en).sort(), Object.keys(translations.es).sort());
    const keys = [...html.matchAll(/data-i18n(?:-alt|-aria)?="([^"]+)"/g)].map(match => match[1]);
    for (const lang of ['en', 'es']) {
        for (const key of keys) {
            assert.equal(typeof translations[lang][key], 'string', `${lang}: ${key}`);
            assert.ok(translations[lang][key].trim(), `${lang}: ${key} must not be empty`);
        }
    }
});

test('English fallback content and metadata match the language dictionary', () => {
    const elements = [...html.matchAll(/<([a-z][\w-]*)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/gi)];
    assert.ok(elements.length > 100);
    for (const [, , key, content] of elements) {
        assert.equal(normalize(content), normalize(translations.en[key]), key);
    }
    for (const tag of tags) {
        const attrs = attributes(tag);
        if (attrs['data-i18n-alt']) {
            assert.equal(attrs.alt, translations.en[attrs['data-i18n-alt']]);
        }
        if (attrs['data-i18n-aria']) {
            assert.equal(attrs['aria-label'], translations.en[attrs['data-i18n-aria']]);
        }
        if (tag.startsWith('<meta ') && attrs.id?.startsWith('meta-')) {
            assert.equal(normalize(attrs.content), normalize(translations.en[attrs.id]), attrs.id);
        }
    }
    assert.equal(normalize(html.match(/<title>(.*?)<\/title>/)[1]), translations.en['meta-title']);
});

test('IDs are unique and internal navigation and local assets resolve', () => {
    const ids = tags.map(tag => attributes(tag).id).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, 'Duplicate element IDs');
    for (const tag of tags) {
        const attrs = attributes(tag);
        for (const value of [attrs.href, attrs.src].filter(Boolean)) {
            if (value.startsWith('#')) {
                assert.ok(ids.includes(value.slice(1)), `Missing anchor target: ${value}`);
            } else if (!/^[a-z][a-z\d+.-]*:/i.test(value)) {
                assert.ok(existsSync(path.join(root, decodeURIComponent(value))), `Missing asset: ${value}`);
            }
        }
    }
    const toggle = attributes(tags.find(tag => attributes(tag).class === 'nav-toggle'));
    assert.equal(toggle['aria-expanded'], 'false');
    assert.ok(ids.includes(toggle['aria-controls']));
});

test('the travel guide button uses the working GitHub Pages destination', () => {
    const link = attributes(tags.find(tag => attributes(tag)['data-i18n'] === 'ai-card4-link1'));
    assert.equal(link.href, 'https://beagandica.github.io/beaglobaltraveler/');
    assert.equal(link.target, '_blank');
    assert.ok(link.rel.split(' ').includes('noopener'));
    assert.ok(!html.includes('https://beaglobaltraveler.com'));
});

test('impact counters agree and distinguish workshop delivery from global reach', () => {
    const highlights = [...html.matchAll(/class="highlight-number">([^<]+)</g)].map(match => match[1]);
    const stats = [...html.matchAll(/class="stat-number">([^<]+)</g)].map(match => match[1]);
    assert.deepEqual(highlights, ['23,737+', '41', '10+']);
    assert.deepEqual(stats, ['23,737+', '86', '41', '7']);
    const reachSource = attributes(tags.find(tag => attributes(tag)['data-i18n'] === 'nuevo-reach-source'));
    assert.equal(reachSource.href, 'https://www.nuevofoundation.org/blog/post/1750');
    assert.match(translations.en['nuevo-impact-note'], /workshops and website visits/);
    assert.match(translations.es['nuevo-impact-note'], /talleres y visitas al sitio web/);
    assert.match(translations.en['nuevo-stat2-label'], /6 territories/);
    assert.match(translations.es['nuevo-stat2-label'], /6 territorios/);
});

test('Forbes recognition remains explicitly a shortlist, not a list selection', () => {
    assert.match(translations.en['achievement5-title'], /shortlist/i);
    assert.match(translations.es['achievement5-title'], /preseleccionada/i);
    for (const lang of ['en', 'es']) {
        assert.match(translations[lang]['achievement5-desc'], /2019 Forbes Under 30 Summit Europe|Forbes Under 30 Summit Europe de 2019/);
    }
});

test('sharing metadata uses the actual domain and absolute image URLs', () => {
    const canonical = attributes(tags.find(tag => attributes(tag).rel === 'canonical'));
    assert.equal(canonical.href, 'https://beagandica.com/');
    const metadata = Object.fromEntries(tags.filter(tag => tag.startsWith('<meta '))
        .map(tag => {
            const attrs = attributes(tag);
            return [attrs.property || attrs.name, attrs.content];
        }));
    assert.equal(metadata['og:url'], canonical.href);
    for (const key of ['og:image', 'twitter:image']) {
        const url = new URL(metadata[key]);
        assert.equal(url.origin, 'https://beagandica.com');
        assert.ok(existsSync(path.join(root, decodeURIComponent(url.pathname.slice(1)))));
    }
});

test('page photos stay below 1 MB combined and below-the-fold images load lazily', () => {
    const images = tags.filter(tag => tag.startsWith('<img ')).map(attributes).filter(img => img.src);
    const photos = images.filter(img => img.src.endsWith('.webp'));
    assert.equal(photos.length, 8);
    const bytes = photos.reduce((total, img) => total + statSync(path.join(root, img.src)).size, 0);
    assert.ok(bytes < 1_000_000, `Page photos total ${bytes} bytes`);
    for (const img of photos) {
        assert.ok(Number(img.width) > 0 && Number(img.height) > 0, img.src);
    }
    for (const img of images) {
        if (img['data-i18n-alt'] === 'aria-hero-img') {
            assert.equal(img.fetchpriority, 'high');
            assert.notEqual(img.loading, 'lazy');
        } else {
            assert.equal(img.loading, 'lazy', img.src);
        }
    }
});
