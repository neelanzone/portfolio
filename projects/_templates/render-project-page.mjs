import { renderFooterBlock, renderHeader, renderMetaTags, renderMoreProjectsBlock, renderProjectSidebar } from './layout.mjs';
import { renderSection } from './render-sections.mjs';
import { renderLudoBentoPage } from './template-replication/ludo-bento.mjs';
import { renderAssetSearchBentoPage } from './template-replication/asset-search-bento.mjs';
import { renderProjectLongformPage } from './project-longform/project-longform.mjs';
import { escapeHtml } from './template-utils.mjs';

function buildStackSections(project) {
    const stackSections = [];

    for (let index = 0; index < project.sections.length; index += 1) {
        const section = project.sections[index];
        const nextSection = project.sections[index + 1];

        if (section.type === 'context' && nextSection?.type === 'users') {
            stackSections.push({
                ...section,
                embeddedUsers: nextSection
            });
            index += 1;
            continue;
        }

        if (section.type === 'users') {
            continue;
        }

        stackSections.push(section);
    }

    return stackSections;
}

export function renderProjectPage(project, site) {
    if (project.customTemplate === 'asset-search-bento') {
        return renderAssetSearchBentoPage(project, site);
    }

    if (project.customTemplate === 'ludo-bento') {
        return renderLudoBentoPage(project, site);
    }

    if (project.customTemplate === 'project-longform') {
        return renderProjectLongformPage(project, site);
    }

    const toRoot = '../../';
    const defaultThemeClass = 'light-theme';
    const themeClass = `theme-${project.theme}`;
    const themeBootScript = `<script>(function(){try{var storedTheme=localStorage.getItem('theme');var themeClass=storedTheme==='dark'?'dark-theme':'light-theme';document.documentElement.classList.remove('light-theme','dark-theme');document.documentElement.classList.add(themeClass);}catch(error){document.documentElement.classList.add('light-theme');}})();</script>`;
    const metaTags = renderMetaTags(project, site);
    const stackSections = buildStackSections(project);
    const tailMarkup = `${renderMoreProjectsBlock(project, site, toRoot)}\n${renderFooterBlock(site, toRoot)}`;
    const sectionsMarkup = stackSections
        .map((section, index) => renderSection(section, {
            toRoot,
            stackIndex: index,
            tailMarkup: section.type === 'outcomes' ? tailMarkup : ''
        }))
        .join('\n');

    return `<!DOCTYPE html>
<html lang="en" class="${escapeHtml(defaultThemeClass)}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${metaTags}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Merriweather:wght@400;700;900&family=Nunito+Sans:ital,opsz,wght@0,6..12,300;0,6..12,400;0,6..12,600;1,6..12,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    ${themeBootScript}
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="../_shared/tailwind-config.js"></script>
    <link rel="stylesheet" href="../_shared/project-reference.css">
    <link rel="stylesheet" href="../_shared/project-system.css">
    <link rel="stylesheet" href="../_shared/project-sidebar-mobile-component.css">
</head>
<body class="project-page project-page--sidebar-layout ${escapeHtml(themeClass)} overflow-x-hidden bg-canvas bg-grain font-body text-ink antialiased selection:bg-accent selection:text-white">
${renderHeader(project, site, toRoot)}
    <div class="project-page-layout">
${renderProjectSidebar(project, site, toRoot)}
        <div class="project-page-layout__main">
            <div id="project-stack-overlay" aria-hidden="true"></div>
            <div id="page-scale">
                <main class="project-scroll-stage pt-20 sm:pt-20 lg:pt-24">
${sectionsMarkup}
                </main>
            </div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" defer></script>
    <script src="../_shared/project-page.js" defer></script>
    <script src="../_shared/project-stack.js" defer></script>
</body>
</html>`;
}


