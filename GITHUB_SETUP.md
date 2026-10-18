# KOMI 问卷：GitHub 存储与后台

## 文件

- `komi-diagnostic.html`：发给客户的问卷页面
- `admin.html`：你自己使用的后台查阅页面
- `api/submit.js`：接收问卷并创建 GitHub Issue 的服务端接口

## 建议的仓库结构

使用一个 **Private** 仓库保存问卷数据，例如 `komi-questionnaire`。GitHub Pages 可以发布问卷页面；Issue 数据仍由仓库权限保护。

## 服务端环境变量

把 `api/submit.js` 部署到 Vercel 或其他 Serverless 平台，并配置：

```text
GITHUB_TOKEN=github_pat_xxxxx
GITHUB_OWNER=你的用户名或组织名
GITHUB_REPO=私有仓库名
GITHUB_LABELS=questionnaire,new-lead
ALLOWED_ORIGIN=https://你的GitHub用户名.github.io
```

Token 只需要目标仓库 Issues 的写权限，不要把它提交到 GitHub。部署完成后，问卷默认调用同域名的 `/api/submit`；如果问卷和接口不在同一域名，可在页面加载前设置 `window.KOMI_SUBMIT_ENDPOINT` 为接口完整地址。

如果使用 GitHub Pages + Vercel 两个域名，请把 `komi-diagnostic.html` 中的 `komi-submit-endpoint` meta 标签改成 Vercel 接口地址，例如 `https://你的项目.vercel.app/api/submit`。

## 管理后台

打开 `admin.html`，填入 GitHub 用户/组织、私有仓库名，以及一个 Fine-grained Personal Access Token：

- 只查看：Issues / Read-only
- 查看并点击“标记已跟进”：Issues / Read and write

Token 仅存于当前页面内存，不会写入文件；关闭页面即清除。后台通过 GitHub API 查询 `questionnaire` 标签的 Issue。

首次使用前，请在仓库中创建 `questionnaire` 和 `new-lead` 两个 Issue 标签，否则 GitHub 可能拒绝自动创建带标签的 Issue。

## 注意

问卷内容可能含有联系人和业务资料，仓库必须设为 Private。上传的图片目前只记录文件名，不会把图片内容上传到 GitHub；如需保存原图，需要另接 GitHub Releases、对象存储或加密附件方案。
