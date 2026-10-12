/* Real-model, memory-only chat. No credentials, simulated replies, or automatic POST retries. */
'use strict';
(() => {
  function init() {
    const root = document.getElementById('niangaoAgent');
    if (!root || root.dataset.agentBound === 'true') return;
    const ids = ['agentConnection', 'agentMessages', 'agentSuggestions', 'agentForm', 'agentInput', 'agentCharCount', 'agentReset', 'agentStop', 'agentSend', 'agentStatus', 'agentReconnect'];
    const nodes = Object.fromEntries(ids.map(id => [id, root.querySelector('#' + id)]));
    if (ids.some(id => !nodes[id])) return;
    root.dataset.agentBound = 'true';
    const { agentConnection: connection, agentMessages: log, agentSuggestions: suggestions, agentForm: form, agentInput: input, agentCharCount: count, agentReset: reset, agentStop: stop, agentSend: send, agentStatus: status, agentReconnect: reconnect } = nodes;
    const config = window.NIANGAO_AGENT_CONFIG;
    const localHost = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
    let base = localHost ? '' : (typeof config?.apiBase === 'string' ? config.apiBase : '').replace(/\/+$/, '');
    let transport = 'sse';
    const HARD_INPUT = 1500, HARD_HISTORY = 12, HARD_OUTPUT = 6000;
    const HEALTH_TIMEOUT = 8000, REQUEST_TIMEOUT = 120000, IDLE_TIMEOUT = 45000;
    let maxInput = HARD_INPUT, maxHistory = HARD_HISTORY, maxOutput = HARD_OUTPUT, maxTotal = 12000;
    let history = [], active = null, failed = null, generation = 0;
    let ready = false, healthRequest = null, healthSequence = 0, cooldownUntil = 0, cooldownTimer = 0;

    function element(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function announce(text, kind = '') {
      status.textContent = text;
      status.dataset.kind = kind;
    }
    function setConnection(text, state) {
      connection.textContent = text;
      connection.dataset.state = state;
    }
    function syncControls() {
      const blocked = !ready || !!active || Date.now() < cooldownUntil;
      send.disabled = blocked || !input.value.trim() || input.value.length > maxInput;
      input.readOnly = !!active;
      stop.hidden = !active;
      reconnect.disabled = !!active || !!healthRequest;
      suggestions.querySelectorAll('[data-agent-question]').forEach(button => { button.disabled = blocked; });
      log.querySelectorAll('.agent-retry').forEach(button => { button.disabled = blocked; });
      count.textContent = input.value.length + ' / ' + maxInput;
      log.setAttribute('aria-busy', String(!!active));
    }
    function nearBottom() { return log.scrollHeight - log.scrollTop - log.clientHeight < 64; }
    function scrollBottom() { log.scrollTop = log.scrollHeight; }
    function trimDisplay() {
      const rows = Array.from(log.querySelectorAll('.agent-message'));
      while (rows.length > maxHistory) rows.shift().remove();
    }
    function showEmpty() {
      log.replaceChildren(element('p', 'agent-empty', '这里是年糕.Agent的聊天窗口。连接成功后，选一个话题，或写下你的问题。没有预录回复。'));
    }
    function bubble(role, text) {
      log.querySelector('.agent-empty')?.remove();
      const row = element('article', 'agent-message agent-message-' + role);
      const name = element('span', 'agent-message-name', role === 'user' ? '你' : '年糕.Agent · AI');
      const body = element('div', 'agent-bubble');
      const message = element('p', 'agent-message-text', text);
      body.append(message);
      row.append(name, body);
      log.append(row);
      trimDisplay();
      return { row, name, body, message };
    }
    function generating(reply) {
      const indicator = element('div', 'agent-generating');
      indicator.setAttribute('aria-hidden', 'true');
      const dots = element('span', 'agent-dots');
      for (let i = 0; i < 3; i++) dots.append(element('i'));
      // Stepped pixel orbit around the dots, plus a phrase that cycles while the model works.
      const orbit = element('span', 'agent-orbit');
      orbit.append(element('i'), element('i'));
      const label = element('span', 'agent-thinking', '正在思考');
      indicator.append(orbit, dots, label);
      reply.body.append(indicator);
      const phrases = ['正在思考', '翻一下记忆', '组织语言', '马上就好'];
      let step = 0;
      const phraseTimer = setInterval(() => {
        if (!indicator.isConnected) { clearInterval(phraseTimer); return; }
        step = (step + 1) % phrases.length;
        label.textContent = phrases[step];
      }, 1700);
      return indicator;
    }
    function boundedLimit(value, fallback, minimum) {
      return Number.isSafeInteger(value) && value >= minimum ? Math.min(value, fallback) : fallback;
    }
    function publicError(error) {
      if (error?.status === 404 || error instanceof TypeError) return '年糕的电脑或隧道暂未在线，请稍后重试连接。';
      if (error?.status === 401 || error?.status === 403) return '年糕的电脑或隧道暂未在线，后端授权或配置暂不可用。';
      if (error?.status === 429) return '请求过于频繁，请稍后再试。';
      return typeof error?.message === 'string' ? error.message.slice(0, 240) : '年糕的电脑或隧道暂未在线，请稍后重试。';
    }
    async function responseError(response) {
      let code = '', message = '';
      try {
        const payload = await response.json();
        code = typeof payload?.error?.code === 'string' ? payload.error.code.slice(0, 80) : '';
        message = typeof payload?.error?.message === 'string' ? payload.error.message.slice(0, 240) : '';
      } catch { /* Do not present HTML error bodies as chat replies. */ }
      const error = new Error(message || '后端请求失败（HTTP ' + response.status + '）。');
      error.status = response.status;
      error.code = code;
      error.retryAfter = response.headers.get('Retry-After');
      return error;
    }
    function applyCooldown(value) {
      if (!value) return '';
      const numeric = Number(value);
      const delay = Number.isFinite(numeric) ? numeric * 1000 : Date.parse(value) - Date.now();
      if (!Number.isFinite(delay) || delay <= 0) return '';
      const ms = Math.min(delay, 3600000);
      cooldownUntil = Date.now() + ms;
      clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => { cooldownUntil = 0; syncControls(); if (!active && ready) announce('等待结束，可以手动重试。不会自动发送请求。'); }, ms);
      return ' 请等待约 ' + Math.ceil(ms / 1000) + ' 秒再手动重试。';
    }
    async function checkHealth() {
      if (active || healthRequest) return;
      ready = false;
      const request = { controller: new AbortController(), sequence: ++healthSequence, timedOut: false };
      healthRequest = request;
      reconnect.hidden = false;
      setConnection('连接检查中', 'checking');
      announce('正在检查真实模型后端；检查成功前不会发送消息。');
      syncControls();
      const timer = setTimeout(() => { request.timedOut = true; request.controller.abort(); }, HEALTH_TIMEOUT);
      try {
        const response = await fetch(base + '/api/agent/health', { method: 'GET', cache: 'no-store', signal: request.controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw await responseError(response);
        const data = await response.json();
        if (healthRequest !== request || request.sequence !== healthSequence) return;
        if (data?.configured !== true) throw new Error('年糕的电脑暂未完成模型配置，请稍后重试连接。');
        if (typeof data.model !== 'string' || !((data.mode === 'local' && data.transport === 'sse') || (data.mode === 'tunnel' && data.transport === 'polling')) || (localHost && data.transport !== 'sse')) throw new Error('年糕的电脑或隧道健康检查响应不完整，请稍后重试。');
        transport = data.transport;
        maxInput = boundedLimit(data.limits?.maxInputChars, HARD_INPUT, 1);
        maxHistory = boundedLimit(data.limits?.maxMessages, HARD_HISTORY, 2);
        // Keep complete user/assistant pairs; the pending request ends with one user.
        maxHistory -= maxHistory % 2;
        maxOutput = boundedLimit(data.limits?.maxOutputChars, HARD_OUTPUT, 1);
        maxTotal = boundedLimit(data.limits?.maxTotalChars, 12000, 1);
        maxInput = Math.min(maxInput, maxTotal);
        history = history.slice(-maxHistory);
        input.maxLength = maxInput;
        trimDisplay();
        ready = true;
        reconnect.hidden = true;
        setConnection((data.mode === 'local' ? '本机' : '隧道') + '配置已就绪 / ' + data.model.slice(0, 60), 'ready');
        announce('后端配置已就绪，尚未验证模型调用。这是 AI，不是年糕本人；Enter 发送，Shift + Enter 换行。');
      } catch (error) {
        if (healthRequest !== request || request.sequence !== healthSequence) return;
        ready = false;
        setConnection('未连接', 'error');
        announce(request.timedOut ? '年糕的电脑或隧道暂未在线，连接检查超时，请稍后重试。' : publicError(error), 'error');
      } finally {
        clearTimeout(timer);
        if (healthRequest === request) { healthRequest = null; syncControls(); }
      }
    }

    // Incremental SSE parser: chunk-safe UTF-8, LF/CRLF/CR, and multiple events.
    // Only contract delta.text is rendered; reasoning/metadata events are ignored.
    async function consumeSSE(response, request, onDelta) {
      if (!response.body || !/text\/event-stream/i.test(response.headers.get('Content-Type') || '')) throw new Error('后端未返回有效的流式响应，回复未完成。');
      const reader = response.body.getReader();
      request.reader = reader;
      const decoder = new TextDecoder();
      let buffer = '', dataLines = [], eventSize = 0, done = false;
      const current = () => active === request && request.generation === generation && !request.controller.signal.aborted;
      function dispatch() {
        if (!dataLines.length) return;
        const raw = dataLines.join('\n');
        dataLines = [];
        eventSize = 0;
        let packet;
        try { packet = JSON.parse(raw); } catch { throw new Error('流式响应格式异常，回复未完成。'); }
        if (!packet || typeof packet !== 'object') throw new Error('流式响应格式异常，回复未完成。');
        if (packet.type === 'error') {
          const error = new Error(typeof packet.message === 'string' ? packet.message.slice(0, 240) : '模型返回错误，回复未完成。');
          error.code = typeof packet.code === 'string' ? packet.code.slice(0, 80) : '';
          error.status = packet.status;
          error.retryAfter = packet.retryAfter;
          throw error;
        }
        if (packet.type === 'done') {
          if (packet.truncated === true) throw new Error('回复已截断，未完成本轮对话。');
          done = true; return;
        }
        if (packet.type === 'delta' && typeof packet.text === 'string') onDelta(packet.text);
      }
      function line(text) {
        if (text === '') { dispatch(); return; }
        if (text.startsWith(':')) return;
        const colon = text.indexOf(':');
        const field = colon < 0 ? text : text.slice(0, colon);
        let value = colon < 0 ? '' : text.slice(colon + 1);
        if (value.startsWith(' ')) value = value.slice(1);
        if (field === 'data') {
          eventSize += value.length;
          if (eventSize > 65536) throw new Error('流式事件过长，已停止接收。');
          dataLines.push(value);
        }
      }
      function drain(eof = false) {
        while (!done) {
          const index = buffer.search(/[\r\n]/);
          if (index < 0) break;
          if (buffer[index] === '\r' && index === buffer.length - 1 && !eof) break;
          const width = buffer[index] === '\r' && buffer[index + 1] === '\n' ? 2 : 1;
          const text = buffer.slice(0, index);
          buffer = buffer.slice(index + width);
          line(text);
        }
        if (buffer.length > 65536) throw new Error('流式数据过长，已停止接收。');
        if (eof && !done) { if (buffer) { line(buffer); buffer = ''; } dispatch(); }
      }
      try {
        while (!done) {
          if (!current()) throw new DOMException('Cancelled', 'AbortError');
          const chunk = await reader.read();
          if (!current()) throw new DOMException('Cancelled', 'AbortError');
          request.touch();
          if (chunk.done) { buffer += decoder.decode(); drain(true); break; }
          buffer += decoder.decode(chunk.value, { stream: true });
          drain();
        }
        if (!done) throw new Error('连接提前结束，回复未完成。');
      } finally {
        try { await reader.cancel(); } catch { /* Already aborted/closed. */ }
        try { reader.releaseLock(); } catch { /* A cancelled read may still settle. */ }
        request.reader = null;
      }
    }
    // DELETE is independent of the cancelled stream/poll signal, and never retried.
    function deleteJob(request) {
      if (!request.jobId || request.deleteSent) return;
      request.deleteSent = true;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);
      fetch(base + '/api/agent/jobs/' + request.jobId, { method: 'DELETE', signal: controller.signal, keepalive: true, headers: { Accept: 'application/json' } })
        .catch(() => { /* Best effort; gateway also expires jobs without polling. */ })
        .finally(() => clearTimeout(timer));
    }
    function withAbort(promise, signal) {
      return new Promise((resolve, reject) => {
        const abort = () => reject(new DOMException('Cancelled', 'AbortError'));
        if (signal.aborted) { promise.catch(() => {}); abort(); return; }
        signal.addEventListener('abort', abort, { once: true });
        promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
      });
    }
    function pollDelay(request) {
      return new Promise((resolve, reject) => {
        const signal = request.controller.signal;
        let timer;
        const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
        if (signal.aborted) { abort(); return; }
        signal.addEventListener('abort', abort, { once: true });
        timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 750);
      });
    }
    async function consumePolling(messages, request, onDelta) {
      // A cancelled POST may already have created a job. Keep its response receiver
      // alive (bounded by the original total deadline) so its jobId can be deleted.
      const postController = new AbortController();
      const postTimer = setTimeout(() => postController.abort(), REQUEST_TIMEOUT);
      const creation = (async () => {
        try {
          const response = await fetch(base + '/api/agent/chat', { method: 'POST', signal: postController.signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ messages }) });
          if (!response.ok) throw await responseError(response);
          const data = await response.json();
          if (typeof data?.jobId === 'string' && /^[a-f0-9]{48}$/i.test(data.jobId)) request.jobId = data.jobId;
          if (request.controller.signal.aborted) deleteJob(request);
          if (response.status !== 202 || !request.jobId || data.pollAfterMs !== 750) throw new Error('轮询任务响应异常，回复未完成。');
        } finally { clearTimeout(postTimer); }
      })();
      await withAbort(creation, request.controller.signal);
      let cursor = 0;
      while (!request.controller.signal.aborted) {
        await pollDelay(request);
        request.touch(); // Empty successful polls still count as activity.
        const response = await fetch(base + '/api/agent/jobs/' + request.jobId + '?after=' + cursor, { method: 'GET', cache: 'no-store', signal: request.controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw await responseError(response);
        const data = await response.json();
        if (request.controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        request.touch();
        if (!Array.isArray(data?.events) || !Number.isSafeInteger(data.cursor) || data.cursor !== cursor + data.events.length || typeof data.finished !== 'boolean') throw new Error('轮询响应异常，回复未完成。');
        let done = false;
        for (const packet of data.events) {
          if (!packet || typeof packet !== 'object' || done) throw new Error('轮询事件顺序异常，回复未完成。');
          if (packet.type === 'error') {
            const error = new Error(typeof packet.message === 'string' ? packet.message.slice(0, 240) : '模型返回错误，回复未完成。');
            error.code = packet.code;
            error.status = packet.status;
            error.retryAfter = packet.retryAfter;
            throw error;
          }
          if (packet.type === 'done') {
            if (packet.truncated !== false) throw new Error('回复已截断或结束状态不完整，本轮不保存。');
            done = true;
          } else if (packet.type === 'delta' && typeof packet.text === 'string') onDelta(packet.text);
          else if (packet.type !== 'ready') throw new Error('轮询事件异常，回复未完成。');
        }
        cursor = data.cursor;
        if (done) {
          if (!data.finished) throw new Error('轮询结束状态异常，回复未完成。');
          return;
        }
        if (data.finished) throw new Error('连接提前结束，回复未完成。');
      }
      throw new DOMException('Cancelled', 'AbortError');
    }
    function finishIncomplete(request, reason, error = false) {
      request.indicator.remove();
      request.reply.row.classList.add('agent-message-incomplete');
      request.reply.name.textContent = '年糕.Agent · 未完成';
      if (!request.output) request.reply.message.textContent = '没有收到完整回复。';
      request.reply.body.append(element('p', 'agent-message-note', reason + ' 本轮不计入后续上下文。'));
      const retry = element('button', 'agent-retry', '重试这个问题');
      retry.type = 'button';
      retry.addEventListener('click', () => {
        if (!ready || active || Date.now() < cooldownUntil) return;
        start(request.text, request);
      });
      request.reply.body.append(retry);
      failed = request;
      announce(reason + ' 不会自动重发；手动重试是一次新请求，可能产生费用。', error ? 'error' : '');
    }
    function releaseRequest(request) {
      clearTimeout(request.totalTimer);
      clearTimeout(request.idleTimer);
      if (active === request) active = null;
      syncControls();
    }
    function cancelCurrent(reason) {
      const request = active;
      if (!request) return;
      generation++;
      active = null;
      request.controller.abort();
      finishIncomplete(request, reason);
      releaseRequest(request);
    }
    async function start(rawText, previous = null) {
      const text = rawText.trim();
      if (!ready || active || Date.now() < cooldownUntil) return;
      if (!text) { announce('先写下一句话，再发送。'); input.focus(); return; }
      if (text.length > maxInput) { announce('输入最长 ' + maxInput + ' 个字符，请缩短后发送。', 'error'); input.focus(); return; }
      // A retry replaces the failed UI pair. Neither partial answer nor failed user
      // ever enters confirmed history, and no previous requests are replayed.
      if (!previous && failed?.text === text) previous = failed;
      let user;
      if (previous?.user.row.isConnected) { user = previous.user; previous.reply.row.remove(); log.append(user.row); }
      else user = bubble('user', text);
      failed = null;
      const reply = bubble('assistant', '');
      const request = { text, user, reply, indicator: generating(reply), output: '', controller: new AbortController(), generation: ++generation, timedOut: false, idleTimer: 0, totalTimer: 0, reader: null, touch: null };
      active = request;
      request.controller.signal.addEventListener('abort', () => deleteJob(request), { once: true });
      request.touch = () => {
        clearTimeout(request.idleTimer);
        request.idleTimer = setTimeout(() => { request.timedOut = true; request.controller.abort(); }, IDLE_TIMEOUT);
      };
      request.totalTimer = setTimeout(() => { request.timedOut = true; request.controller.abort(); }, REQUEST_TIMEOUT);
      request.touch();
      input.value = '';
      syncControls();
      announce('年糕.Agent 正在生成；可以停止。回复结束前请稍等。');
      scrollBottom();
      const current = () => active === request && generation === request.generation;
      try {
        // Reserve one complete pair so both request and retained history stay bounded.
        let prior = maxHistory > 2 ? history.slice(-(maxHistory - 2)) : [];
        while (prior.length && prior.reduce((sum, message) => sum + message.content.length, 0) + text.length > maxTotal) prior = prior.slice(2);
        const messages = prior.concat({ role: 'user', content: text });
        const onDelta = delta => {
          if (!current()) return;
          const stick = nearBottom();
          const remaining = maxOutput - request.output.length;
          request.output += delta.slice(0, remaining);
          request.reply.message.textContent = request.output;
          if (stick) scrollBottom();
          if (delta.length > remaining) {
            const error = new Error('回复达到 ' + maxOutput + ' 字符上限，已截断并停止生成。');
            error.code = 'OUTPUT_LIMIT';
            request.controller.abort();
            throw error;
          }
        };
        if (transport === 'polling') await consumePolling(messages, request, onDelta);
        else {
          const response = await fetch(base + '/api/agent/chat', { method: 'POST', signal: request.controller.signal, headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ messages }) });
          if (!current()) return;
          request.touch();
          if (!response.ok) throw await responseError(response);
          await consumeSSE(response, request, onDelta);
        }
        if (!current() || request.controller.signal.aborted) return;
        if (!request.output.trim()) throw new Error('模型没有返回可显示的文字，未保存本轮对话。');
        request.indicator.remove();
        history = messages.concat({ role: 'assistant', content: request.output }).slice(-maxHistory);
        announce('回复完成。仅页面内存保留最多 ' + maxHistory + ' 条消息；超长对话会自动舍弃较早轮次。');
      } catch (error) {
        deleteJob(request);
        if (!current()) return;
        let reason = request.timedOut ? '请求超时，已停止接收。' : publicError(error);
        if (error?.status === 429) reason += applyCooldown(error.retryAfter);
        if ([401, 403, 404].includes(error?.status)) {
          ready = false;
          reconnect.hidden = false;
          setConnection('未连接', 'error');
        }
        finishIncomplete(request, reason, true);
      } finally {
        clearTimeout(request.totalTimer);
        clearTimeout(request.idleTimer);
        if (current()) {
          const shouldFocus = document.activeElement === stop || document.activeElement === send;
          releaseRequest(request);
          if (shouldFocus) input.focus({ preventScroll: true });
        }
      }
    }

    status.setAttribute('aria-atomic', 'true');
    input.setAttribute('aria-describedby', 'agentCharCount agentStatus');
    input.maxLength = maxInput;
    log.tabIndex = 0;
    const disclaimer = element('p', 'agent-disclaimer', '真实模型对话 · AI 不是年糕本人。「蒸馏」是公开人格提示词整理，不是训练或微调。');
    root.querySelector('.agent-terminal-head')?.after(disclaimer);
    showEmpty();
    // Protect only this component from the adventure's global shortcuts.
    root.addEventListener('keydown', event => event.stopPropagation());
    log.addEventListener('wheel', event => event.stopPropagation(), { passive: true });
    input.addEventListener('input', syncControls);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        if (!send.disabled) start(input.value);
      }
    });
    form.addEventListener('submit', event => { event.preventDefault(); start(input.value); });
    suggestions.querySelectorAll('[data-agent-question]').forEach(button => {
      button.type = 'button';
      button.addEventListener('click', () => { if (!button.disabled) start(button.dataset.agentQuestion || ''); });
    });
    stop.type = reset.type = reconnect.type = 'button';
    stop.addEventListener('click', () => { cancelCurrent('已停止生成，显示的内容可能不完整。'); input.focus({ preventScroll: true }); });
    reset.addEventListener('click', () => {
      generation++;
      if (active) { active.controller.abort(); clearTimeout(active.totalTimer); clearTimeout(active.idleTimer); active = null; }
      const wasChecking = !!healthRequest;
      if (healthRequest) { healthSequence++; healthRequest.controller.abort(); healthRequest = null; }
      history = []; failed = null; input.value = ''; showEmpty(); syncControls();
      announce('已重开对话，旧请求已取消，页面内存中的消息已清空。');
      input.focus({ preventScroll: true });
      if (wasChecking) checkHealth();
    });
    window.addEventListener('adventure:chapter', event => {
      if (event.detail?.index !== 7) cancelCurrent('已离开营地，停止生成。');
    });
    window.addEventListener('pagehide', () => cancelCurrent('页面已离开，停止生成。'));
    // PC-hosted tunnel address changes; a long-open tab keeps a working reply path.
    if (!localHost) {
      const configFile = document.currentScript?.src?.replace(/[^/]*$/, '') + 'agent-config.js';
      setInterval(async () => {
        if (document.hidden) return;
        try {
          const response = await fetch(new URL('agent-config.js', document.baseURI).href + '?live=' + Date.now(), { cache: 'no-store' });
          if (!response.ok) return;
          const text = await response.text();
          const match = text.match(/apiBase["']?\s*:\s*["'](https:\/\/[a-z0-9-]+\.trycloudflare\.com)["']/);
          const fresh = match ? match[1] : '';
          if (fresh && fresh !== base) {
            const previous = base;
            base = fresh;
            if (!active && !healthRequest) checkHealth();
            else {
              ready = false;
              setConnection('隧道地址已变化，正在重连', 'checking');
              announce('电脑上的服务换了新地址，正在自动重连。');
            }
            void previous;
          }
        } catch { /* Keep the current working address; the next health probe decides. */ }
      }, 45000);
    }
    reconnect.addEventListener('click', checkHealth);
    syncControls();
    checkHealth();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
