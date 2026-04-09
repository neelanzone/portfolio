(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }

    root.SharedSidebarTemplate = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function renderRoles(roles) {
        if (!Array.isArray(roles) || !roles.length) {
            return '';
        }

        return roles.map(function (role, index) {
            var separator = index < roles.length - 1
                ? '<span class="home-sidebar__dot" aria-hidden="true">&bull;</span>'
                : '';
            return '<span>' + escapeHtml(role) + '</span>' + separator;
        }).join('');
    }

    function renderSummarySection(section, options) {
        if (!section || !section.title) {
            return '';
        }

        var classNames = ['home-sidebar__page', 'home-sidebar__page-group'];
        if (options && options.className) {
            classNames.push(options.className);
        }

        var attributes = options && options.attributes ? ' ' + options.attributes : '';
        var openAttribute = section.open === false ? '' : ' open';
        var briefMarkup = section.brief
            ? '\n                    <p class="home-sidebar__page-brief">' + escapeHtml(section.brief) + '</p>'
            : '';
        var contentMarkup = section.contentHtml
            ? '\n                    <span class="home-sidebar__index-divider" aria-hidden="true"></span>\n                    ' + section.contentHtml
            : '';

        return '\n                <details class="' + escapeHtml(classNames.join(' ')) + '"' + openAttribute + attributes + '>' +
            '\n                    <summary class="home-sidebar__page-title home-sidebar__page-title--toggle">' + escapeHtml(section.title) + '</summary>' +
            briefMarkup +
            contentMarkup +
            '\n                </details>';
    }
    function renderBirdsSection(section) {
        if (!section || !section.title) {
            return '';
        }

        var attributes = section.attributes ? ' ' + section.attributes : '';
        var openAttribute = section.open ? ' open' : '';
        var copyMarkup = section.copy
            ? '\n                    <div class="home-sidebar__page-richtext">\n                        <p>' + escapeHtml(section.copy) + '</p>\n                    </div>'
            : '';
        var links = Array.isArray(section.links) ? section.links : [];
        var linksMarkup = links.length
            ? '\n                    <nav class="home-sidebar__index-submenu home-sidebar__page-nav" aria-label="' + escapeHtml(section.navAriaLabel || (section.title + ' links')) + '">' +
                '\n                        ' + links.map(function (item) {
                    var href = item && item.href ? item.href : '#';
                    var classNames = ['home-sidebar__index-sublink'];
                    if (item && item.className) {
                        classNames = classNames.concat(String(item.className).split(/\s+/).filter(Boolean));
                    }
                    var sectionNavAttribute = (item && item.sectionNav !== false && /^#/.test(href)) ? ' data-section-nav-link' : '';
                    var currentAttribute = item && item.current ? ' aria-current="page"' : '';
                    return '<a class="' + escapeHtml(classNames.join(' ')) + '" href="' + escapeHtml(href) + '"' + sectionNavAttribute + currentAttribute + '>' + escapeHtml(item && item.label ? item.label : '') + '</a>';
                }).join('\n                        ') +
                '\n                    </nav>'
            : '';
        var citationMarkup = section.citationHtml
            ? '\n                    <p class="home-sidebar__page-citation">' + section.citationHtml + '</p>'
            : '';
        var videoMarkup = section.videoSrc
            ? '\n                    <div class="home-sidebar__video">\n                        <iframe\n                            src="' + escapeHtml(section.videoSrc) + '"\n                            title="' + escapeHtml(section.videoTitle || 'Sidebar reference video') + '"\n                            loading="lazy"\n                            referrerpolicy="strict-origin-when-cross-origin"\n                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"\n                            allowfullscreen\n                        ></iframe>\n                    </div>'
            : '';

        return '\n                <details class="home-sidebar__page home-sidebar__page--birds home-sidebar__page-group"' + openAttribute + attributes + '>' +
            '\n                    <summary class="home-sidebar__page-title home-sidebar__page-title--toggle">' + escapeHtml(section.title) + '</summary>' +
            copyMarkup +
            linksMarkup +
            citationMarkup +
            videoMarkup +
            '\n                </details>';
    }

    function renderIndexBlock(index) {
        if (!index) {
            return '';
        }

        var aboutHref = index.aboutHref || '#about';
        var aboutLabel = index.aboutLabel || 'About';
        var aboutAttributes = index.aboutAttributes ? ' ' + index.aboutAttributes : '';
        var workGroupAttributes = index.workGroupAttributes ? ' ' + index.workGroupAttributes : '';
        var workSummaryAttributes = index.workSummaryAttributes ? ' ' + index.workSummaryAttributes : '';
        var workSummaryLabel = index.workSummaryLabel || 'Work';
        var workItems = Array.isArray(index.workItems) ? index.workItems : [];
        var workLinksMarkup = workItems.map(function (item) {
            var currentAttribute = item.current ? ' aria-current="page"' : '';
            return '<a class="home-sidebar__index-sublink" href="' + escapeHtml(item.href || '#') + '"' + currentAttribute + '>' + escapeHtml(item.label || '') + '</a>';
        }).join('\n                                ');

        return '\n                <div class="home-sidebar__index-block">' +
            '\n                    <nav class="home-sidebar__index" aria-label="' + escapeHtml(index.ariaLabel || 'Section index') + '">' +
            '\n                        <a class="home-sidebar__index-link" href="' + escapeHtml(aboutHref) + '"' + aboutAttributes + '>' + escapeHtml(aboutLabel) + '</a>' +
            '\n                        <details class="home-sidebar__index-group"' + workGroupAttributes + '>' +
            '\n                            <summary class="home-sidebar__index-link home-sidebar__index-link--toggle"' + workSummaryAttributes + '>' + escapeHtml(workSummaryLabel) + '</summary>' +
            '\n                            <div class="home-sidebar__index-submenu">' +
            '\n                                ' + workLinksMarkup +
            '\n                            </div>' +
            '\n                        </details>' +
            '\n                    </nav>' +
            '\n                </div>';
    }

    function renderFooter(footer) {
        if (!footer) {
            return '';
        }

        return '\n            <div class="home-sidebar__bottom">' +
            '\n                <div class="home-sidebar__meta">' +
            '\n                    <span class="home-sidebar__title">' + escapeHtml(footer.title || 'Neel Banerjee') + '</span>' +
            '\n                    <p class="home-sidebar__tagline">' + (footer.taglineHtml || escapeHtml(footer.tagline || '')) + '</p>' +
            '\n                </div>' +
            '\n                <div class="home-sidebar__actions">' +
            '\n                    <a class="home-sidebar__logo" href="' + escapeHtml(footer.logoHref || '#hero') + '" aria-label="' + escapeHtml(footer.logoLabel || 'Back to top') + '">' +
            '\n                        <img src="' + escapeHtml(footer.logoSrc || 'Assets/identity-motion-active-sidebar.gif') + '" alt="' + escapeHtml(footer.logoAlt || 'neel Logo') + '">' +
            '\n                    </a>' +
            '\n                    <a class="home-sidebar__contact" href="' + escapeHtml(footer.emailHref || 'mailto:neelanzone@gmail.com') + '"><span class="home-sidebar__contact-label">' + escapeHtml(footer.contactLabel || 'Get in touch') + '</span></a>' +
            '\n                </div>' +
            '\n            </div>';
    }

    function renderSidebarMobileMenuButton(options) {
        var config = options || {};
        var classNames = ['home-topbar__menu'];
        if (config.extraClassName) {
            classNames = classNames.concat(String(config.extraClassName).split(/\s+/).filter(Boolean));
        }

        var toggleDataAttribute = config.toggleDataAttribute ? ' ' + config.toggleDataAttribute : '';
        var controls = config.controlsId || 'home-sidebar';
        var expanded = config.expanded === true ? 'true' : 'false';
        var ariaLabel = config.ariaLabel || 'Expand sidebar';

        return '\n    <button' +
            '\n        class="' + escapeHtml(classNames.join(' ')) + '"' +
            '\n        type="button"' + toggleDataAttribute +
            '\n        aria-controls="' + escapeHtml(controls) + '"' +
            '\n        aria-expanded="' + escapeHtml(expanded) + '"' +
            '\n        aria-label="' + escapeHtml(ariaLabel) + '"' +
            '\n    >' +
            '\n        <span class="home-topbar__menu-icon" aria-hidden="true"></span>' +
            '\n    </button>';
    }

    function renderSidebar(options) {
        var config = options || {};
        var classNames = ['home-sidebar'];
        if (config.extraClassName) {
            classNames = classNames.concat(String(config.extraClassName).split(/\s+/).filter(Boolean));
        }

        var rootAttributes = [];
        rootAttributes.push('class="' + escapeHtml(classNames.join(' ')) + '"');
        rootAttributes.push('id="' + escapeHtml(config.sidebarId || 'home-sidebar') + '"');
        if (config.rootDataAttribute) {
            rootAttributes.push(config.rootDataAttribute);
        }
        rootAttributes.push('aria-label="' + escapeHtml(config.ariaLabel || 'Site navigation') + '"');

        var toggleDataAttribute = config.toggleDataAttribute ? ' ' + config.toggleDataAttribute : '';
        var mergedPortfolioSection = config.portfolioSection;
        if (config.portfolioSection && config.index && config.index.embedInPortfolio) {
            mergedPortfolioSection = Object.assign({}, config.portfolioSection, {
                contentHtml: renderIndexBlock(config.index)
            });
        }

        var introSectionRenderers = {
            projectSection: function () {
                return renderSummarySection(config.projectSection, { className: '' });
            },
            portfolioSection: function () {
                return renderSummarySection(mergedPortfolioSection, { className: 'home-sidebar__page--portfolio', attributes: config.portfolioAttributes });
            },
            birdsSection: function () {
                return renderBirdsSection(config.birdsSection);
            },
            index: function () {
                return config.index && config.index.embedInPortfolio ? '' : renderIndexBlock(config.index);
            }
        };
        var introOrder = Array.isArray(config.introOrder) && config.introOrder.length
            ? config.introOrder
            : ['projectSection', 'portfolioSection', 'birdsSection', 'index'];
        var introMarkup = introOrder.map(function (key) {
            var renderer = introSectionRenderers[key];
            return renderer ? renderer() : '';
        }).join('');

        return '    <aside ' + rootAttributes.join(' ') + '>' +
            '\n        <div class="home-sidebar__top">' +
            '\n            <button' +
            '\n                class="home-sidebar__toggle"' +
            '\n                type="button"' + toggleDataAttribute +
            '\n                aria-controls="' + escapeHtml(config.sidebarId || 'home-sidebar') + '"' +
            '\n                aria-expanded="true"' +
            '\n                aria-label="Collapse sidebar"' +
            '\n            >' +
            '\n                <span class="home-sidebar__toggle-icon" aria-hidden="true"></span>' +
            '\n            </button>' +
            '\n        </div>' +
            '\n        <div class="home-sidebar__body">' +
            '\n            <div class="home-sidebar__intro">' +
            '\n                <p class="home-sidebar__roles">' + renderRoles(config.roles) + '</p>' +
            introMarkup +
            '\n            </div>' +
            renderFooter(config.footer) +
            '\n        </div>' +
            '\n    </aside>';
    }

    return {
        escapeHtml: escapeHtml,
        renderSidebar: renderSidebar,
        renderSidebarMobileMenuButton: renderSidebarMobileMenuButton
    };
});
