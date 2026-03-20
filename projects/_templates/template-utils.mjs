export function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function withBreaks(value = '') {
    return escapeHtml(value).replaceAll('\n', '<br>');
}

export function absoluteUrl(siteUrl, pathname) {
    if (!siteUrl) {
        return '';
    }

    return new URL(pathname, siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`).toString();
}

export function resolveAssetPath(assetPath, toRoot) {
    if (!assetPath) {
        return '';
    }

    if (/^(https?:)?\/\//.test(assetPath)) {
        return assetPath;
    }

    return `${toRoot}${assetPath.replace(/^\.\//, '')}`;
}

export function resolveProjectLink(link, currentSlug, toRoot) {
    if (!link) {
        return `${toRoot}index.html`;
    }

    if (link.type === 'project') {
        if (link.slug === currentSlug) {
            return './index.html';
        }

        return `../${link.slug}/index.html`;
    }

    if (link.type === 'home-anchor') {
        return `${toRoot}index.html${link.value ?? ''}`;
    }

    return link.href ?? `${toRoot}index.html`;
}

export function stackCardAttributes(stackIndex) {
    return `class="project-stack-card border-b border-rule/80" data-stack-card data-stack-index="${stackIndex}" style="--stack-card-index:${stackIndex};"`;
}

