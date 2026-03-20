/* Generated from design-project-template-desktop.html */
tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        body: ['"Instrument Sans"', 'sans-serif'],
                        display: ['"Merriweather"', 'serif'],
                        mono: ['"Space Mono"', 'monospace']
                    },
                    colors: {
                        canvas: 'rgb(var(--canvas) / <alpha-value>)',
                        surface: 'rgb(var(--surface) / <alpha-value>)',
                        ink: 'rgb(var(--ink) / <alpha-value>)',
                        subtext: 'rgb(var(--subtext) / <alpha-value>)',
                        rule: 'rgb(var(--rule) / <alpha-value>)',
                        accent: 'rgb(var(--accent) / <alpha-value>)',
                        note: {
                            gold: 'rgb(var(--note-gold) / <alpha-value>)',
                            lilac: 'rgb(var(--note-lilac) / <alpha-value>)',
                            peach: 'rgb(var(--note-peach) / <alpha-value>)'
                        },
                        stage: 'rgb(var(--stage) / <alpha-value>)'
                    },
                    fontSize: {
                        tag: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.2em' }],
                        eyebrow: ['1rem', { lineHeight: '1.2rem', letterSpacing: '0.14em' }],
                        body: ['1.25rem', { lineHeight: '1.6' }],
                        lead: ['1.25rem', { lineHeight: '1.6' }],
                        icon: ['1.25rem', { lineHeight: '1' }],
                        title: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
                        cardtitle: ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
                        stat: ['2rem', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
                        displaysubhead: ['clamp(2rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
                        displaysection: ['clamp(3rem, 5vw, 3.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
                        displayhero: ['clamp(4rem, 7vw, 4.5rem)', { lineHeight: '1.12', letterSpacing: '-0.035em' }]
                    },
                    boxShadow: {
                        soft: '0 18px 60px -38px rgba(24, 23, 22, 0.22)',
                        note: '0 18px 40px -24px rgba(24, 23, 22, 0.28)'
                    },
                    backgroundImage: {
                        grain: 'radial-gradient(circle at top left, var(--grain-a), transparent 28%), radial-gradient(circle at bottom right, var(--grain-b), transparent 22%)'
                    }
                }
            }
        };
