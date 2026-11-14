// All editable site content lives here. Change the text without touching the layout code.
window.SITE = {
  nav: [
    { label: 'Features', href: '#tools', side: [
      { label: 'AI editing', img: 'assets/features/feature-6.webp', text: 'Edit your video by writing comments' },
      { label: "What's new", img: 'assets/features/feature-5.webp', text: 'Sound improvements and color correction' }
    ], columns: [
      { title: 'AI creation', links: ['AI Design', 'Video Studio', 'AI Video Generator', 'AI Image Generator', 'AI Image Enhancer'] },
      { title: 'Text & Audio', links: ['Auto Captions', 'Caption Styles', 'Speech to Text', 'Text to Speech', 'Custom Voices', 'Voice Enhancer', 'Noise Cleaner'] },
      { title: 'Image', links: ['Background Remover', 'Image Combiner', 'Image Upscaler', 'Image Resizer', 'Photo Editor', 'Text Remover', 'Object Remover'] },
      { title: 'Video', links: ['Video Background Remover', 'Video Upscaler', 'Video Editor', 'Video Trimmer', 'Add Subtitles', 'Video Converter'] }
    ] },
    { label: 'Blog', href: '#', columns: [
      { title: 'Learn', links: ['Tutorials', 'Guides', 'Tips & Tricks'] },
      { title: 'Stories', links: ['Creator Stories', 'Case Studies'] },
      { title: 'News', links: ['Product Updates', 'Announcements'] }
    ] },
    { label: 'Pricing', href: '#pricing' }
  ],

  // Features accordion: one row per main feature, opening to its description and a coded mockup of the editor.
  // `ui` picks the mockup, drawn in feature-ui.js.
  tools: [
    { title: 'Cut Mistakes', ui: 'mistakes', text: 'Retakes, filler words and long pauses are removed automatically.' },
    { title: 'Zooms and Sound Effects', ui: 'zoomsfx', text: 'AI understands your video and automatically adds zooms and sound effects to keep viewers engaged.' },
    { title: 'Overlays and B-roll', ui: 'overlays', text: 'Add images and B-roll over your footage, and let AI find the perfect moments to place them.' },
    { title: 'Custom Styles', ui: 'presets', text: 'Style your own captions and set your own preferences for cuts, custom sound effects and more.' },
    { title: 'Sound Improvements and Color Correction', ui: 'enhance', text: 'Get clearer audio and more vibrant colors with automatic enhancements.' },
    { title: 'Edit with Comments', ui: 'ai', text: 'Leave a comment at any moment, and let AI make the changes.' },
    { title: 'Edit with Text', ui: 'transcript', text: 'Delete or bring back words in your transcript, and the changes are automatically reflected in your video.' },
    { title: 'Edit Using the Timeline', ui: 'cuts', text: 'Take full control of your edits. Drag, trim, and fine-tune every clip exactly how you want.' }
  ],

  // Client videos, by Wistia media ID. All three use the editor demo's video for now:
  // swap in each client's own video ID (with their permission), real names and follower counts.
  showcase: [
    { client: 'Client Name', followers: '000K', face: 'peach', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'mint', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'rose', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'peach', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'mint', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'rose', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'peach', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'mint', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'rose', wistia: 'xyco9e53i1' },
    { client: 'Client Name', followers: '000K', face: 'peach', wistia: 'xyco9e53i1' }
  ],

  // "Why creators choose" section: two stat cards with bars, a "no waiting" card, then perk cards.
  // A bar's `pct` is its length; `ours` marks the Cutly bar.
  why: {
    stats: [
      { label: 'Cost per video', title: '20x cheaper', vs: 'than an editor', dark: true,
        from: { name: 'Editor', value: '$5.00' }, to: { name: 'Cutly', value: '$0.25' } },
      { label: 'Time per video', title: '6x faster', vs: 'than editing by hand',
        from: { name: 'By hand', value: '30 min' }, to: { name: 'Cutly', value: '5 min' } }
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

  // Pricing (the owner, 2026-11-14): credits a month; a first edit is 2 credits, so aboutVideos = credits / 2.
  // The monthly price is aboutVideos x perVideo. Every card lists ALL of planFeatures (the owner: show what you do and do not get);
  // level: how many of them the plan includes, counted from the top (the rest show greyed with a dash).
  plans: [
    { name: 'Start', credits: 200, aboutVideos: 100, perVideo: 0.25, level: 5 },
    { name: 'Pro', credits: 400, aboutVideos: 200, perVideo: 0.30, level: 9, popular: true },
    { name: 'Ultra', credits: 600, aboutVideos: 300, perVideo: 0.35, level: 12 }
  ],
  planFeatures: ['Cut mistakes automatically', 'Remove retakes and silences','Auto captions', 'Zooms and sound effects', 'Edit by text, comments or timeline',
    'Overlays and B-roll', 'Queue unlimited videos', 'Presets for your style', 'Caption presets',
    'Custom sound effects', 'Studio Sound', 'Color grading'],

  faq: [
    ['Can Cutly automatically remove duplicate takes?', 'Yes! Cutly automatically finds and removes duplicate takes. You can also remove anything else with a simple comment.'],
    ['How many credits does a video use?', 'Credits are used whenever you ask Cutly’s AI to perform a task. A first edit usually costs 2 credits, while comments can cost anywhere from 0 to 1 credit.'],
    ['How many videos can I upload?', 'You can add as many videos to the queue as your available credits allow. Cutly will process them in batches until they’re all finished.'],
    ['Can I customize my videos?', 'Yes! You can create your own caption styles, save custom cut presets, upload your own sound effects, and much more.'],
    ['Do I need video editing experience to use Cutly?', 'Not at all! Cutly does the hard work for you. Just tell it what you want, and let AI handle the rest.'],
    ['Can I make manual edits to my videos?', 'Yes! You can use comments or the timeline, depending on how much control you want.'],
    ['Can Cutly make mistakes?', 'Yes, Cutly can make mistakes, but it’s very easy to fix them using comments or the built-in timeline.'],
    ['Can Cutly replace my video editor?', 'Cutly helps you or your editor work 6x faster, but it can still make mistakes, so a person should review the final edit.']
  ],

  // Placeholders. Use real reviews only, with the customer's permission.
  reviews: [
    { name: 'Customer Name', face: 'mint' },
    { name: 'Customer Name', face: 'peach' },
    { name: 'Customer Name', face: 'lilac' },
    { name: 'Customer Name', face: 'rose' }
  ],
  // DESIGN SAMPLES ONLY, NOT REAL PEOPLE OR REVIEWS. script.js shows them only on a local copy (localhost / 127.0.0.1 / a file) or through
  // the private review link https://cutlyai.app/?preview sent to the site's testers; a normal visit never shows them. Replace with real reviews
  // (with permission) and delete this list before launch.
  sampleReviews: [
    { name: 'Maya R.', followers: '48K', face: 'mint', text: 'I used to spend my whole Sunday editing. Now it’s done before lunch.', mark: 'done before lunch' },
    { name: 'Jordan T.', followers: '112K', face: 'peach', text: 'The duplicate take thing is unreal. I ramble, restart lines, say “wait, let me do that again”, and Cutly just keeps the good version.', mark: 'keeps the good version' },
    { name: 'Priya S.', followers: '230K', face: 'lilac', text: 'I post product reviews every day and editing was the part I dreaded. I upload five videos at night and in the morning they’re cut, zoomed and captioned. I still tweak a few things with comments, but it takes minutes instead of hours.', mark: 'minutes instead of hours' },
    { name: 'Leo M.', followers: '21K', face: 'rose', text: 'Captions and zooms in one click. Finally.', mark: 'in one click' }
  ],

  // Footer columns: [label, link]
  footer: [
    { title: 'Product', links: [['Features', '#tools'], ['Reviews', '#reviews'], ['Pricing', '#pricing']] },
    { title: 'Company', links: [['Blog', 'blog/'], ['Help Center', '#'], ['Contact', 'contact.html']] }
  ],
  tagline: 'The AI Powered Video Editor That Does the Hard Work for You.',
  legal: ['Terms of Service', 'Privacy Policy', 'Cookie Policy']
};
