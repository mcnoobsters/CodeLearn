(function () {
  const baseTracks = [
    {
      id: "python",
      name: "Python",
      color: "#ffd166",
      description: "Beginner to advanced Python with syntax, control flow, data, OOP.",
      lessons: [
        {
          id: "py-1",
          title: "Intro to Python",
          content: `
<p>Python is a high-level, interpreted language. Use <code>print()</code> to display output.</p>
<pre><code>print("Hello, world!")</code></pre>
<p>Variables are dynamically typed:</p>
<pre><code>x = 10
name = "Ada"
pi = 3.14159
is_valid = True</code></pre>
          `,
          assignment: {
            questions: [
              { id: "q1", type: "mcq", prompt: "What does print() do in Python?", options: ["Declares a variable","Outputs text to the console","Imports a module","Defines a function"], correctIndex: 1, explanation: "print() sends output to stdout or console." },
              { id: "q2", type: "freeform", prompt: "Write a small Python snippet that prints your name and favorite number.", placeholder: "print(\"Your Name\", 42)" },
            ],
          },
        },
        {
          id: "py-2",
          title: "Control Flow",
          content: `
<p>Use <code>if</code>, <code>elif</code>, and <code>else</code> for branching.</p>
<pre><code>num = 7
if num % 2 == 0:
    print("even")
elif num % 3 == 0:
    print("divisible by 3")
else:
    print("other")</code></pre>
<p>Loops include <code>for</code> and <code>while</code>.</p>
<pre><code>for i in range(3):
    print(i)</code></pre>
          `,
          assignment: { questions: [ { id: "q1", type: "mcq", prompt: "Which loop iterates over a sequence?", options: ["for","while","switch","loop"], correctIndex: 0, explanation: "for iterates over sequences or iterators." } ] },
        },
        {
          id: "py-3",
          title: "Collections and Functions",
          content: `
<p>Common collections: <code>list</code>, <code>tuple</code>, <code>dict</code>, <code>set</code>.</p>
<pre><code>def add(a, b):
    return a + b
print(add(2, 3))</code></pre>
          `,
          assignment: { questions: [ { id: "q1", type: "freeform", prompt: "Define a function multiply(a, b) that returns the product.", placeholder: "def multiply(a, b):\n    return a * b" } ] },
        },
      ],
    },
    {
      id: "html",
      name: "HTML",
      color: "#f87171",
      description: "Structure web pages with semantic elements and accessible markup.",
      lessons: [
        { id: "html-1", title: "Basics and Structure", content: `
<p>HTML defines the structure of a page.</p>
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
  &lt;head&gt;&lt;title&gt;Hello&lt;/title&gt;&lt;/head&gt;
  &lt;body&gt;Hi&lt;/body&gt;
&lt;/html&gt;</code></pre>
          `, assignment: { questions: [ { id: "q1", type: "mcq", prompt: "Which tag represents the main content heading?", options: ["<p>","<h1>","<div>","<span>"], correctIndex: 1, explanation: "<h1> is the main heading level." } ] } },
        { id: "html-2", title: "Links and Images", content: `
<p>Use <code>&lt;a&gt;</code> for links and <code>&lt;img&gt;</code> for images.</p>
<pre><code>&lt;a href="/about"&gt;About&lt;/a&gt;
&lt;img src="photo.jpg" alt="A photo" /&gt;</code></pre>
          `, assignment: { questions: [ { id: "q1", type: "freeform", prompt: "Create a link to https://example.com with text 'Visit Example'.", placeholder: "<a href=\"https://example.com\">Visit Example</a>" } ] } },
        { id: "html-3", title: "Semantic Elements", content: `
<p>Use semantic tags: <code>&lt;header&gt;, &lt;main&gt;, &lt;nav&gt;, &lt;footer&gt;</code>.</p>
          `, assignment: { questions: [ { id: "q1", type: "mcq", prompt: "Which tag is best for navigation links?", options: ["<article>","<nav>","<section>","<aside>"], correctIndex: 1, explanation: "<nav> contains navigation links." } ] } },
      ],
    },
    {
      id: "css",
      name: "CSS",
      color: "#a78bfa",
      description: "Style web pages with layout, typography, color, and responsive design.",
      lessons: [
        { id: "css-1", title: "Selectors and Properties", content: `
<p>Style elements using selectors and declarations.</p>
<pre><code>p { color: #333; }
.btn { background: #2563eb; }</code></pre>
          `, assignment: { questions: [ { id: "q1", type: "mcq", prompt: "Which selector targets elements with class 'btn'?", options: [".btn","#btn","btn","*btn*"], correctIndex: 0, explanation: ".btn matches elements whose class includes btn." } ] } },
        { id: "css-2", title: "Box Model and Layout", content: `
<p>Understand margin, border, padding, and content box.</p>
<pre><code>.card { padding: 12px; border: 1px solid #e5e7eb; }</code></pre>
          `, assignment: { questions: [ { id: "q1", type: "freeform", prompt: "Write CSS to center a div horizontally using flexbox.", placeholder: ".parent { display:flex; justify-content:center; }" } ] } },
        { id: "css-3", title: "Responsive Design", content: `
<p>Use media queries to adapt layouts to screen size.</p>
<pre><code>@media (max-width: 600px) { .sidebar { display: none; } }</code></pre>
          `, assignment: { questions: [ { id: "q1", type: "mcq", prompt: "Which property sets flex direction to vertical?", options: ["flex-direction: row","flex-direction: wrap","flex-direction: column","flex-direction: grid"], correctIndex: 2, explanation: "column stacks children vertically." } ] } },
      ],
    },
    {
      id: "javascript",
      name: "JavaScript",
      color: "#60a5fa",
      description: "Frontend programming with JS: syntax, DOM, async, and patterns.",
      lessons: [
        { id: "js-1", title: "Basics and Variables", content: `
<p>Use <code>const</code>, <code>let</code>, and <code>var</code> (avoid var).</p>
<pre><code>const name = "Ada";
let count = 0;
count++;</code></pre>
          `, assignment: { questions: [ { id: "q1", type: "mcq", prompt: "Which keyword defines a block-scoped variable that can change?", options: ["const","let","var","static"], correctIndex: 1, explanation: "let is block-scoped and mutable." } ] } },
        { id: "js-2", title: "Functions and Arrow Syntax", content: `
<p>Functions can be declared or expressed as arrows.</p>
<pre><code>function add(a,b){ return a+b; }
const mul = (a,b) => a*b;</code></pre>
          `, assignment: { questions: [ { id: "q1", type: "freeform", prompt: "Write an arrow function double(n) that returns n*2.", placeholder: "const double = (n) => n*2;" } ] } },
        { id: "js-3", title: "DOM and Events", content: `
<p>Use <code>document.querySelector</code> and event listeners.</p>
<pre><code>document.querySelector('#btn').addEventListener('click', () => {
  alert('hi');
});</code></pre>
          `, assignment: { questions: [ { id: "q1", type: "mcq", prompt: "Which method finds the first element matching a CSS selector?", options: ["getElementById","querySelectorAll","querySelector","getElementsByClassName"], correctIndex: 2, explanation: "querySelector returns the first match." } ] } },
      ],
    },
  ];

  function checkpointOptionsFor(trackId) {
    if (trackId === "python") return [
      { id: "py-cp-1", title: "Number Guessing Game", description: "CLI game: random number 1-100 with attempts and hints." },
      { id: "py-cp-2", title: "To-Do CLI", description: "Add/list/complete tasks; persist to a file (JSON or CSV)." },
      { id: "py-cp-3", title: "Text Analyzer", description: "Read a file, count words, characters, top N frequent words." },
    ];
    if (trackId === "html") return [
      { id: "html-cp-1", title: "Portfolio Page", description: "Build a semantic, accessible personal portfolio page." },
      { id: "html-cp-2", title: "Product Landing", description: "Landing page with hero, features, and call-to-action." },
      { id: "html-cp-3", title: "Blog Article", description: "Article layout with headings, lists, quotes, and images." },
    ];
    if (trackId === "css") return [
      { id: "css-cp-1", title: "Responsive Card Grid", description: "Create a responsive grid of cards with hover states." },
      { id: "css-cp-2", title: "Landing Page Layout", description: "Navbar, hero, sections, and footer, responsive at breakpoints." },
      { id: "css-cp-3", title: "Mini UI Kit", description: "Buttons, badges, cards in a consistent style system." },
    ];
    if (trackId === "javascript") return [
      { id: "js-cp-1", title: "To-Do App", description: "Add/edit/delete tasks with localStorage persistence." },
      { id: "js-cp-2", title: "Quiz App", description: "Multiple-choice quiz with score and review." },
      { id: "js-cp-3", title: "Weather Dashboard", description: "UI with city search; use mock data or a free API." },
    ];
    return [];
  }

  function buildCheckpointLesson(trackId, trackName) {
    return {
      id: `${trackId}-checkpoint`,
      title: `${trackName} Checkpoint Project`,
      projectType: "checkpoint",
      content: `
<p>This is your midpoint checkpoint. Choose one of the three project options and outline your plan. When you are ready, mark this lesson complete.</p>
<ul>
  <li>Pick one project option</li>
  <li>Write a short plan</li>
  <li>Build it and iterate</li>
  <li>Use the IDE below to prototype</li>
  </ul>
      `,
      assignment: { questions: [ { id: "choice", type: "project_choice", prompt: "Choose your checkpoint project (pick one):", options: checkpointOptionsFor(trackId) }, { id: "plan", type: "freeform", prompt: "Outline your plan: features, timeline, and risks.", placeholder: "Feature list, MVP scope, timeline, and stretch goals..." } ] },
    };
  }

  function buildFinalProjectLesson(trackId, trackName) {
    return {
      id: `${trackId}-final`,
      title: `${trackName} Final Project`,
      projectType: "final",
      content: `
<p>The final project can be anything that showcases what you've learned. Aim for scope that's challenging but achievable. Submit details below.</p>
<ul>
  <li>Title and short description</li>
  <li>Links (GitHub, demo, screenshots)</li>
  <li>Reflection: What did you learn?</li>
  <li>Use the IDE below to test ideas</li>
</ul>
      `,
      assignment: { questions: [ { id: "submit", type: "project_submit", prompt: "Submit your final project details" } ] },
    };
  }

  function withProjects(tracks) {
    return tracks.map((t) => {
      const base = t.lessons.slice();
      const halfIdx = Math.ceil(base.length / 2);
      const checkpoint = buildCheckpointLesson(t.id, t.name);
      const finalProject = buildFinalProjectLesson(t.id, t.name);
      const augmented = base.slice(0, halfIdx)
        .concat([checkpoint])
        .concat(base.slice(halfIdx))
        .concat([finalProject]);
      return { ...t, lessons: augmented };
    });
  }

  const tracks = withProjects(baseTracks);

  function getTrackById(id) { return tracks.find((t) => t.id === id); }
  function getLesson(trackId, lessonId) { const track = getTrackById(trackId); if (!track) return undefined; return track.lessons.find((l) => l.id === lessonId); }

  window.Curriculum = { tracks, getTrackById, getLesson };
})();

