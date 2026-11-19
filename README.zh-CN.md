# flowlet

[English](./README.md) | 简体中文

**flowlet** 是一款面向移动端的纯本地离线记账 PWA（Progressive Web App），专注于轻量记录日常支出并看清资金流向。所有账本数据保存在浏览器本地 IndexedDB（Dexie 4）中，无需账号、无后端服务，支持离线打开、多维统计图表、预算提醒与 CSV / JSON 导入导出。

## 技术栈

- **前端框架**：React 19 + TypeScript + Vite 6 + React Router 7
- **样式与图表**：Tailwind CSS 4 + ECharts 6
- **本地存储与 PWA**：Dexie 4（IndexedDB）+ `vite-plugin-pwa`
- **数据导入导出**：PapaParse（UTF-8 BOM CSV）+ JSON 备份
- **测试工具**：Vitest + `fake-indexeddb` + Playwright

## 核心功能

- **本地离线存储**：全部数据仅存在本地 IndexedDB（`expenses`、`categories`、`budgets`、`settings`），金额以整数「分」（`amountCents`）存储避免浮点误差，内置 12 个默认分类。
- **快速记一笔**：自制数字键盘支持 `+` / `−` 算式输入、备注自动提取 `#标签`、今天/昨天快捷切换、连续记账模式、两步确认删除与预算阈值提醒。
- **明细检索与筛选**：按天分组展示每日小计，支持按月份或全部时间浏览，支持关键词、分类、标签筛选及左滑删除。
- **多维统计分析**：支持月 / 年 / 自定义周期切换，提供 ECharts 分类环形图（点击可下钻至明细）、每日/每月趋势柱状图与均值线、环比对比、标签排行及单笔最大 Top 10。
- **预算管理**：支持总预算与分分类预算设置，在 80% 预警与 100% 超支阈值时触发提示。
- **备份与迁移**：支持导出带 UTF-8 BOM 的 CSV（Excel 打开不乱码）和完整 JSON 备份，支持预览去重导入、合并与覆盖恢复。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run typecheck

# 单元测试与端到端测试
npm run test
npm run test:e2e

# 生产构建与本地预览
npm run build
npm run preview
```
