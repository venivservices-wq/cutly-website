// All editable site content lives here. Change the text without touching the layout code.
window.SITE = {
  nav: [
    { label: 'Features', href: '#tools', promo: 'See what\'s new', columns: [
      { title: 'AI creation', links: ['AI Design', 'Video Studio', 'AI Video Generator', 'AI Image Generator', 'AI Image Enhancer'] },
      { title: 'Text & Audio', links: ['Auto Captions', 'Caption Styles', 'Speech to Text', 'Text to Speech', 'Custom Voices', 'Voice Enhancer', 'Noise Cleaner'] },
      { title: 'Image', links: ['Background Remover', 'Image Combiner', 'Image Upscaler', 'Image Resizer', 'Photo Editor', 'Text Remover', 'Object Remover'] },
      { title: 'Video', links: ['Video Background Remover', 'Video Upscaler', 'Video Editor', 'Video Trimmer', 'Add Subtitles', 'Video Converter'] }
    ] },
    { label: 'Blog', href: '#', promo: 'Read the latest', columns: [
      { title: 'Learn', links: ['Tutorials', 'Guides', 'Tips & Tricks'] },
      { title: 'Stories', links: ['Creator Stories', 'Case Studies'] },
      { title: 'News', links: ['Product Updates', 'Announcements'] }
    ] },
    { label: 'Pricing', href: '#pricing' }
  ],

  // Features accordion: one row per main feature, opening to its description and a coded mockup of the editor.
  // `ui` picks the mockup, drawn in feature-ui.js.
  tools: [
    { title: 'Cut Mistakes Automatically', ui: 'cuts', text: 'Retakes, filler words and long pauses are removed automatically.' },
    { title: 'Auto Captions', ui: 'captions', text: 'Accurate captions in seconds, styled to match your brand.' },
    { title: 'Zooms on Key Moments', ui: 'zooms', text: 'Punch-ins land on the lines that matter and keep people watching.' },
    { title: 'Sound Effects', ui: 'sfx', text: 'Whooshes and pops timed to your cuts, so every edit feels polished.' },
    { title: 'Ask AI for Changes', ui: 'ai', text: 'Type a note like "make this punchier" and the AI makes the edit.' },
    { title: 'Edit by Text', ui: 'transcript', text: 'Delete a word from the transcript and it’s gone from the video.' },
    { title: 'Presets', ui: 'presets', text: 'Save your style once and reuse it on every video in one click.' }
  ],

  // Client videos, by Wistia media ID. All three use the editor demo's video for now:
  // swap in each client's own video ID (with their permission), real names and follower counts.
  showcase: [
    { client: 'Client Name', followers: '000K', face: 'peach', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'mint', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'rose', wistia: 'xyco9e53i1' }
  ],

  // "Why creators choose" section: two stat cards with bars, a "no waiting" card, then perk cards.
  // A bar's `pct` is its length; `ours` marks the Cutly bar.
  why: {
    stats: [
      { label: 'Cost per video', title: '10x cheaper', vs: 'than an editor', dark: true,
        from: { name: 'Editor', value: '$5.00' }, to: { name: 'Cutly', value: '$0.50' } },
      { label: 'Time per video', title: '12x faster', vs: 'than editing by hand',
        from: { name: 'By hand', value: '60 min' }, to: { name: 'Cutly', value: '5 min' } }
    ],
    wait: {
      label: 'Turnaround',
      title: 'No more waiting on editors',
      vs: 'No more missed deadlines',
      before: ['With an editor', '2 days'],
      after: ['With Cutly', '5 min'],
      chat: [['you', 'Hey, any update on the video?', 'Mon'], ['editor', 'Sorry, will send it tomorrow', 'Wed']],
      ready: 'Your edit is ready'
    },
    perks: [
      { label: 'Quality', title: 'Quality you can count on', vs: 'with every single edit' },
      { label: 'Control', title: 'Easy manual edits', vs: 'change anything the AI did' },
      { label: 'Skills', title: 'No experience needed', vs: 'just upload and go' },
      { label: 'Volume', title: 'Scales with your needs', vs: 'from 10 videos to 100' },
      { label: 'Hiring', title: 'Nobody to hire', vs: 'no trials or test edits' },
      { label: 'Management', title: 'Nobody to manage', vs: 'no briefs or follow-ups' }
    ]
  },

  // Pricing: videos per month at a price per video. The monthly price is worked out from these.
  // level: how many of planFeatures the plan includes, counted from the top.
  plans: [
    { name: 'Start', videos: 50, perVideo: 0.5, level: 4 },
    { name: 'Pro', videos: 100, perVideo: 0.5, level: 6, popular: true },
    { name: 'Ultra', videos: 150, perVideo: 0.5, level: 6 }
  ],
  planFeatures: ['Cut mistakes automatically', 'Auto captions', 'Zooms and sound effects', 'Edit by text', 'Ask AI for changes', 'Presets for your style'],

  faq: [
    ['What does Cutly AI do?', 'Upload your raw video and Cutly edits it for you. It cuts mistakes and adds captions, zooms and sound effects.'],
    ['How long does an edit take?', 'About 5 minutes per video, instead of an hour editing by hand.'],
    ['How much does it cost per video?', '$0.50 on every plan. That is 10x cheaper than the $5 you would pay an editor.'],
    ['What is the difference between the plans?', 'Start gives you 50 videos a month, Pro 100 and Ultra 150. Pro and Ultra also include Ask AI for changes and presets for your style.'],
    ['Do I need editing experience?', 'No. Upload your video and Cutly does the editing.'],
    ['Can I change what the AI did?', 'Yes. You can edit by text, ask the AI for changes on Pro and Ultra, or make manual edits yourself.']
  ],

  // Placeholders. Use real reviews only, with the customer's permission.
  reviews: [
    { name: 'Customer Name', face: 'mint' },
    { name: 'Customer Name', face: 'peach' },
    { name: 'Customer Name', face: 'lilac' },
    { name: 'Customer Name', face: 'rose' }
  ],

  // Footer columns: [label, link]
  footer: [
    { title: 'Product', links: [['Features', '#tools'], ['Reviews', '#reviews'], ['Pricing', '#pricing']] },
    { title: 'Company', links: [['Blog', '#'], ['Help Center', '#'], ['Contact', '#']] }
  ],
  tagline: 'Create Videos People Actually Want to Watch, in Just Minutes.',
  legal: ['Terms of Service', 'Privacy Policy', 'Cookie Policy']
};
