/**
 * Vercel/Node serverless handler for the KOMI questionnaire.
 * Creates one private-repository GitHub Issue per submission.
 * Keep GITHUB_TOKEN in server environment variables, never in the HTML.
 */

const json = (res, status, payload) => {
  if (typeof res.status === 'function') {
    res.status(status).json(payload);
    return;
  }
  res.statusCode = status;
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try { return raw ? JSON.parse(raw) : {}; } catch { return null; }
};

const requiredEnv = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
const safeText = (value, max = 6000) => String(value ?? '未填写').slice(0, max);

module.exports = async function handler(req, res) {
  res.setHeader?.('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader?.('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: '只支持 POST 请求' });

  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) return json(res, 500, { ok: false, error: `服务端缺少配置：${missing.join(', ')}` });

  const body = await readBody(req);
  if (!body || typeof body !== 'object') return json(res, 400, { ok: false, error: '请求内容不是有效 JSON' });

  const company = safeText(body['企业 / 联系人'], 160);
  const submittedAt = safeText(body['提交时间'], 80);
  const title = `KOMI问卷｜${company}｜${submittedAt.slice(0, 10)}`.slice(0, 240);
  const lines = Object.entries(body)
    .map(([key, value]) => `### ${safeText(key, 80)}\n${safeText(value)}`)
    .join('\n\n');
  const issueBody = [
    '> 此 Issue 由 KOMI 企业 AI 落地问卷自动创建，请勿在公开仓库中存放敏感资料。',
    '',
    lines
  ].join('\n');
  const labels = (process.env.GITHUB_LABELS || 'questionnaire,new-lead')
    .split(',').map((label) => label.trim()).filter(Boolean).slice(0, 10);

  try {
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(process.env.GITHUB_OWNER)}/${encodeURIComponent(process.env.GITHUB_REPO)}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ title, body: issueBody, labels })
    });
    const payload = await response.json();
    if (!response.ok || !payload.number) {
      return json(res, 502, { ok: false, error: '写入 GitHub 失败', detail: payload.message || payload.status });
    }
    return json(res, 200, { ok: true, issueNumber: payload.number, issueUrl: payload.html_url });
  } catch (error) {
    return json(res, 502, { ok: false, error: '连接 GitHub 失败', detail: error.message });
  }
};
