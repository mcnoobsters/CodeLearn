(function () {
  function createEditor({ mount, value, mode }) {
    const textarea = document.createElement('textarea');
    mount.appendChild(textarea);
    const editor = CodeMirror.fromTextArea(textarea, {
      value: value || '',
      mode,
      theme: 'material-darker',
      lineNumbers: true,
      autoCloseBrackets: true,
      viewportMargin: Infinity,
    });
    editor.setValue(value || '');
    return editor;
  }

  function persistentKey(trackId, lessonId, suffix) {
    return `learnx_code_${trackId}_${lessonId}_${suffix}`;
  }

  function loadCode(trackId, lessonId, suffix, fallback) {
    try {
      const ans = StorageAPI.getAnswer(trackId, lessonId, `ide-${suffix}`);
      if (ans?.answer?.code != null) return ans.answer.code;
      const local = localStorage.getItem(persistentKey(trackId, lessonId, suffix));
      if (local != null) return local;
    } catch {}
    return fallback || '';
  }

  function saveCode(trackId, lessonId, suffix, code) {
    localStorage.setItem(persistentKey(trackId, lessonId, suffix), code);
    try {
      StorageAPI.saveAnswer(trackId, lessonId, `ide-${suffix}`, { code });
    } catch {}
  }

  // Pyodide loader (singleton)
  let pyodideReadyPromise = null;
  function ensurePyodide() {
    if (!pyodideReadyPromise) {
      pyodideReadyPromise = (async () => {
        if (typeof loadPyodide !== 'function') {
          throw new Error('Pyodide not available.');
        }
        const py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });
        // Attempt to route stdout/stderr to callbacks; if not supported, fallback will still show errors via exceptions
        if (typeof py.setStdout === 'function') {
          py.setStdout({
            stdout: (s) => window.__learnx_py_stdout && window.__learnx_py_stdout(s),
            stderr: (s) => window.__learnx_py_stderr && window.__learnx_py_stderr(s),
          });
        }
        return py;
      })();
    }
    return pyodideReadyPromise;
  }

  function mountPython(container, { trackId, lessonId, starter }) {
    const card = document.createElement('section');
    card.className = 'ide card';
    card.innerHTML = `
      <h3>In-browser Python</h3>
      <div class="editor-wrap">
        <div class="editor-row">
          <div class="label">Python</div>
          <div class="editor" data-editor="py"></div>
        </div>
        <div class="button-row">
          <button class="btn primary" data-action="run">Run</button>
          <button class="btn" data-action="clear">Clear Output</button>
          <button class="btn" data-action="reset">Reset Code</button>
        </div>
        <div class="label">Output</div>
        <div class="output" data-output></div>
      </div>
    `;
    const output = card.querySelector('[data-output]');
    const editorMount = card.querySelector('[data-editor="py"]');
    const defaultCode = starter || 'print("Hello from Pyodide!")';
    const initial = loadCode(trackId, lessonId, 'py', defaultCode);
    const editor = createEditor({ mount: editorMount, value: initial, mode: 'python' });

    function appendOut(text, isErr) {
      const div = document.createElement('div');
      div.textContent = text.replace(/\n$/, '');
      if (isErr) div.style.color = '#ef4444';
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
    }

    window.__learnx_py_stdout = (s) => appendOut(s, false);
    window.__learnx_py_stderr = (s) => appendOut(s, true);

    editor.on('change', () => {
      saveCode(trackId, lessonId, 'py', editor.getValue());
    });

    card.querySelector('[data-action="run"]').addEventListener('click', async () => {
      const py = await ensurePyodide();
      try {
        // Install interactive input() using browser prompt and echo the typed value
        await py.runPythonAsync(`
import builtins
try:
    from js import prompt as __learnx_js_prompt
except Exception as __e:
    __learnx_js_prompt = None

def __learnx_input(__p=""):
    if __learnx_js_prompt is None:
        raise RuntimeError("Browser prompt unavailable for input()")
    __s = __learnx_js_prompt(str(__p))
    if __s is None:
        raise KeyboardInterrupt("Input cancelled")
    print(__s)
    return __s

builtins.input = __learnx_input
del __learnx_input
        `);
        await py.runPythonAsync(editor.getValue());
      } catch (err) {
        appendOut(String(err), true);
      }
    });
    card.querySelector('[data-action="clear"]').addEventListener('click', () => {
      output.innerHTML = '';
    });
    card.querySelector('[data-action="reset"]').addEventListener('click', () => {
      editor.setValue(defaultCode);
      saveCode(trackId, lessonId, 'py', defaultCode);
      output.innerHTML = '';
    });

    container.appendChild(card);
    return card;
  }

  function mountWeb(container, { trackId, lessonId, starters, focus }) {
    const htmlDefault = starters?.html || '<!doctype html>\n<html>\n  <head>\n    <meta charset="utf-8">\n    <title>Preview</title>\n  </head>\n  <body>\n    <h1>Hello</h1>\n    <p>Edit HTML/CSS/JS and click Run.</p>\n  </body>\n</html>';
    const cssDefault = starters?.css || 'body { font-family: system-ui, sans-serif; padding: 1rem; }\nh1 { color: #2563eb; }';
    const jsDefault = starters?.js || 'console.log("Hello from JS")';

    const card = document.createElement('section');
    card.className = 'ide card';
    card.innerHTML = `
      <h3>Live HTML/CSS/JS</h3>
      <div class="editor-wrap">
        <div class="split-2">
          <div class="editor-row">
            <div class="label">HTML</div>
            <div class="editor" data-editor="html"></div>
          </div>
          <div class="editor-row">
            <div class="label">CSS</div>
            <div class="editor" data-editor="css"></div>
          </div>
        </div>
        <div class="editor-row">
          <div class="label">JavaScript</div>
          <div class="editor" data-editor="js"></div>
        </div>
        <div class="button-row">
          <button class="btn primary" data-action="run">Run</button>
          <button class="btn" data-action="reset">Reset Code</button>
        </div>
        <iframe class="preview" sandbox="allow-scripts allow-same-origin"></iframe>
      </div>
    `;

    const htmlMount = card.querySelector('[data-editor="html"]');
    const cssMount = card.querySelector('[data-editor="css"]');
    const jsMount = card.querySelector('[data-editor="js"]');

    const htmlInit = loadCode(trackId, lessonId, 'html', htmlDefault);
    const cssInit = loadCode(trackId, lessonId, 'css', cssDefault);
    const jsInit = loadCode(trackId, lessonId, 'js', jsDefault);

    const htmlEd = createEditor({ mount: htmlMount, value: htmlInit, mode: 'xml' });
    const cssEd = createEditor({ mount: cssMount, value: cssInit, mode: 'css' });
    const jsEd = createEditor({ mount: jsMount, value: jsInit, mode: 'javascript' });

    [
      ['html', htmlEd],
      ['css', cssEd],
      ['js', jsEd],
    ].forEach(([key, ed]) => {
      ed.on('change', () => saveCode(trackId, lessonId, key, ed.getValue()));
    });

    if (focus === 'js') jsEd.focus();

    function runPreview() {
      const iframe = card.querySelector('iframe.preview');
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const html = htmlEd.getValue();
      const css = cssEd.getValue();
      const js = jsEd.getValue();
      const full = `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<style>${css}</style>\n</head>\n<body>\n${html}\n<script>\n(function(){\n  const logEl = parent.document.createElement('div');\n  logEl.style.cssText='position:fixed;bottom:10px;right:10px;background:#111827;color:#e5e7eb;padding:6px 8px;border:1px solid #1f2937;border-radius:8px;font:12px ui-monospace;opacity:.9;z-index:2147483647;';\n  function add(msg){ var d=document.createElement('div'); d.textContent=String(msg); logEl.appendChild(d); if(logEl.childNodes.length>8) logEl.removeChild(logEl.firstChild);}\n  const c = console; console = new Proxy(c,{ get(t,p){ if(p==='log') return function(...a){ add(a.join(' ')); return t.log.apply(t,a); }; return t[p]; } });\n  parent.document.body.appendChild(logEl);\n  window.addEventListener('unload',()=>{ try{ parent.document.body.removeChild(logEl);}catch(e){} });\n})();\n</script>\n<script>\n${js}\n</script>\n</body>\n</html>`;
      doc.open();
      doc.write(full);
      doc.close();
    }

    card.querySelector('[data-action="run"]').addEventListener('click', runPreview);
    card.querySelector('[data-action="reset"]').addEventListener('click', () => {
      htmlEd.setValue(htmlDefault);
      cssEd.setValue(cssDefault);
      jsEd.setValue(jsDefault);
      saveCode(trackId, lessonId, 'html', htmlDefault);
      saveCode(trackId, lessonId, 'css', cssDefault);
      saveCode(trackId, lessonId, 'js', jsDefault);
      runPreview();
    });

    // Initial auto-run to show preview
    runPreview();

    container.appendChild(card);
    return card;
  }

  window.IDE = { mountPython, mountWeb };
})();

