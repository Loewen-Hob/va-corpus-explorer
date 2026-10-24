# Corpus & Coding Explorer

《User Intervention in Human–LLM Collaborative Visual Analytics: A Survey》的静态网页补充材料。页面为英文，包含 46 篇纳入论文、9 篇排除候选、编码定义、证据摘要和可下载数据。

## 本地打开

直接双击 `index.html`。样式、交互和数据均内嵌，不需要安装依赖或启动服务器。页面中的 CSV、JSON 和 BibTeX 下载也可离线使用。论文 DOI 与全文链接需要联网。

## 发布到 GitHub Pages

1. 在 GitHub 新建一个公开仓库，例如 `human-llm-va-corpus`。
2. 将本文件夹中的内容上传到仓库根目录，确保 `index.html` 与 `README.md` 位于根目录，不要再嵌套一层文件夹。
3. 打开仓库 **Settings → Pages**，在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择 `main` 分支和 `/(root)`，保存。等待 Pages 部署完成。
5. 复制 GitHub 显示的实际网站 URL。常见形式为 `https://<username>.github.io/human-llm-va-corpus/`。

论文建议链接到可交互的 Pages 网站；网站的原始数据和构建代码同时保留在 GitHub 仓库中。发布时可创建 `v1.0.0` tag/release，以固定论文使用的数据版本。网站支持 `#view=corpus&paper=s02` 这样的论文记录链接，筛选条件也保存在 URL 中。

本包尚未上传或发布，示例 URL 不是已存在的网站。

## 论文中的引用文字

部署成功并得到真实网址后，可在 corpus/coding method 部分写：

```tex
The corpus, operational definitions, and action-level coding crosswalk are
available through an interactive companion website\footnote{\url{ACTUAL_GITHUB_PAGES_URL}}.
```

将 `ACTUAL_GITHUB_PAGES_URL` 替换为实际网址。当前论文源文件未自动插入占位链接。

## 数据与口径

- `data/corpus.csv`：46 篇纳入论文；Data Formulator 的年份为正式 TVCG 卷期的 2024 年。
- `data/stage_mode_crosswalk.csv`：每篇论文各阶段对应的交互模式和证据摘要，所有交互统计均由此计算。
- `data/excluded_candidates.csv`：9 篇排除候选，不计入 46 篇统计。
- `data/references.bib`：61 条完整参考文献，包括排除候选和背景文献。
- `data/CODEBOOK.md`：网页与正文一致的操作定义和计数规则。
- `data/explorer.json`：从上述文件生成的完整页面数据与统计。
- `data/manifest.json`：源文件 SHA-256，用于复核数据快照。

系统级的较宽泛能力标签不用于填充 action-level 矩阵。页面中空阶段字段表示没有记录匹配的主动干预，U 在 DP/VM/VT 下为结构性 NA。每格按不同论文计数；阶段/模式边际统计也去重，因此不是邻接格子的加总。

现有 crosswalk 提供的是编码证据摘要，不是逐字引文，没有逐条 section/page locator。网页不会把它显示成原文引用，也没有补造证据页码。若需要把该材料扩充为逐条可追溯的审稿附件，可后续向源数据补充原文位置。

## 更新与重建

修改 `data/` 下的原始 CSV/BibTeX 后，在本文件夹运行：

```sh
python build.py
```

构建仅使用 Python 标准库，校验记录数、键、DOI、年份与所有编码。当前快照的正文统计也是构建校验的一部分；若未来改变数据，需同步修改预期值。`index.html`、`explorer.json`、`CODEBOOK.md` 和 `manifest.json` 自动生成。交互逻辑、样式和模板在 `src/` 中。

本网站是静态数据浏览器，不上传读者输入，不需要账号，也不包含第三方脚本、统计追踪或全文 PDF。
