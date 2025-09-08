(function () {
  function createEditor({ mount, value, mode }) {
    const textarea = document.createElement('textarea');
    mount.appendChild(textarea);
    if (window.CodeMirror) {
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
    // Fallback to plain textarea API with minimal adapter
    textarea.value = value || '';
    const adapter = {
      getValue: () => textarea.value,
      setValue: (v) => { textarea.value = v; },
      focus: () => textarea.focus(),
      on: (evt, cb) => { if (evt === 'change') textarea.addEventListener('input', cb); },
    };
    return adapter;
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
          <button class="btn" data-action="clear-code">Clear Code</button>
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
import sys
try:
    from js import prompt as __learnx_js_prompt
    from js import window as __learnx_window
except Exception as __e:
    __learnx_js_prompt = None
    __learnx_window = None

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

# Fallback stdout/stderr redirection to JS if setStdout is unavailable
try:
    if __learnx_window is not None:
        class __LearnxWriter:
            def write(self, s):
                try:
                    if s is not None:
                        __learnx_window.__learnx_py_stdout(str(s))
                except Exception:
                    pass
            def flush(self):
                return None
        sys.stdout = __LearnxWriter()
        sys.stderr = __LearnxWriter()
except Exception:
    pass
        `);
        await py.runPythonAsync(editor.getValue());
      } catch (err) {
        appendOut(String(err), true);
      }
    });
    card.querySelector('[data-action="clear"]').addEventListener('click', () => {
      output.innerHTML = '';
    });
    card.querySelector('[data-action="clear-code"]').addEventListener('click', () => {
      editor.setValue('');
      saveCode(trackId, lessonId, 'py', '');
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
          <button class="btn" data-action="clear-code">Clear Code</button>
          <button class="btn" data-action="reset">Reset Code</button>
          <button class="btn" data-action="clear-console">Clear Console</button>
        </div>
        <iframe class="preview" sandbox="allow-scripts allow-same-origin"></iframe>
        <div class="label">Console</div>
        <div class="output" data-web-output></div>
      </div>
    `;

    const htmlMount = card.querySelector('[data-editor="html"]');
    const cssMount = card.querySelector('[data-editor="css"]');
    const jsMount = card.querySelector('[data-editor="js"]');

    const htmlInit = loadCode(trackId, lessonId, 'html', htmlDefault);
    const cssInit = loadCode(trackId, lessonId, 'css', cssDefault);
    const jsInit = loadCode(trackId, lessonId, 'js', jsDefault);

    const htmlEd = createEditor({ mount: htmlMount, value: htmlInit, mode: 'htmlmixed' });
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

    const channel = `${trackId}/${lessonId}`;
    function runPreview() {
      const iframe = card.querySelector('iframe.preview');
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      try {
        const html = htmlEd.getValue();
        const css = cssEd.getValue();
        let js = jsEd.getValue();
        js = js.replace(/<\/(script)/gi, '<\\/$1');
        const full = `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<style>${css}</style>\n</head>\n<body>\n${html}\n<script>\n(function(){\n  function send(type, args){ try{ parent.postMessage({ __learnx_console:true, channel:${JSON.stringify(channel)}, type, args: Array.prototype.slice.call(args).map(String) }, '*'); }catch(e){} }\n  const orig = { log: console.log, warn: console.warn, error: console.error };\n  console.log = function(){ send('log', arguments); return orig.log.apply(console, arguments); };\n  console.warn = function(){ send('warn', arguments); return orig.warn.apply(console, arguments); };\n  console.error = function(){ send('error', arguments); return orig.error.apply(console, arguments); };\n  window.addEventListener('error', function(e){ send('error', [e.message || 'Error']); });\n})();\n</script>\n<script>\n${js}\n</script>\n</body>\n</html>`;
        doc.open();
        doc.write(full);
        doc.close();
      } catch (e) {
        appendWeb('error', String(e && e.message ? e.message : e));
      }
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

    // Console sink in parent
    const webOut = card.querySelector('[data-web-output]');
    function appendWeb(type, msg) {
      const line = document.createElement('div');
      line.textContent = msg;
      if (type === 'error') line.style.color = '#ef4444';
      if (type === 'warn') line.style.color = '#f59e0b';
      webOut.appendChild(line);
      webOut.scrollTop = webOut.scrollHeight;
    }
    function onMsg(e){ const d = e.data; if (!d || !d.__learnx_console) return; if (d.channel !== channel) return; (d.args || []).forEach((m)=>appendWeb(d.type || 'log', m)); }
    window.addEventListener('message', onMsg);

    // Buttons
    runPreview();
    card.querySelector('[data-action="clear-console"]').addEventListener('click', () => { webOut.innerHTML=''; });
    card.querySelector('[data-action="clear-code"]').addEventListener('click', () => {
      htmlEd.setValue(''); cssEd.setValue(''); jsEd.setValue('');
      saveCode(trackId, lessonId, 'html', '');
      saveCode(trackId, lessonId, 'css', '');
      saveCode(trackId, lessonId, 'js', '');
    });

    container.appendChild(card);
    return card;
  }

  window.IDE = { mountPython, mountWeb };
})();

