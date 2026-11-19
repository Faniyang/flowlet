import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const SHOTS_DIR =
  '/home/agnesone/.gemini/antigravity-cli/brain/aa50ad2e-85f6-45ed-a7db-510281ff839d/screenshots';

test.describe('flowlet E2E', () => {
  test('core user flows: seed, add, stats drilldown, budget alerts, csv roundtrip, offline PWA', async ({
    page,
    context,
  }) => {
    await fs.mkdir(SHOTS_DIR, { recursive: true });

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. 首次打开 -> 验证默认 12 分类 -> 记一笔 35+12 餐饮 #聚餐
    await page.goto('/');
    await expect(page.getByTestId('home-month-total')).toContainText('0.00');

    await page.getByTestId('fab-add').click();
    await expect(page.locator('.cat-btn')).toHaveCount(12);
    await expect(page.locator('.cat-grid')).toContainText('运动');
    await expect(page.locator('.cat-grid')).not.toContainText('通讯');

    // 验证金额为 0 时点完成不会提交
    await page.locator('[data-key="done"]').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.locator('[data-cat-id="food"]').click();
    for (const k of ['3', '5', '+', '1', '2']) {
      await page.locator(`[data-key="${k}"]`).click();
    }
    await expect(page.getByTestId('amount-preview')).toHaveText('= 47.00');
    await page.getByTestId('note-input').fill('午饭 #聚餐');
    await page.screenshot({ path: path.join(SHOTS_DIR, '2-add-sheet.png') });

    await page.locator('[data-key="done"]').click();
    await expect(page.getByTestId('toast')).toContainText('47.00');
    await expect(page.getByTestId('home-month-total')).toContainText('47.00');

    // 2. 再记一笔不同分类 -> 统计页占比 & 点击下钻明细
    await page.getByTestId('fab-add').click();
    await page.locator('[data-cat-id="sport"]').click();
    for (const k of ['3', '0']) {
      await page.locator(`[data-key="${k}"]`).click();
    }
    await page.getByTestId('note-input').fill('羽毛球 #运动');
    await page.locator('[data-key="done"]').click();
    await expect(page.getByTestId('home-month-total')).toContainText('77.00');

    await page.getByRole('link', { name: '统计' }).click();
    await expect(page.getByTestId('stats-cat-food')).toContainText('61.0%');
    await expect(page.getByTestId('stats-cat-sport')).toContainText('39.0%');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOTS_DIR, '3-stats.png') });

    await page.getByTestId('stats-cat-food').click();
    await expect(page.getByTestId('list-summary')).toContainText('1 笔');
    await expect(page.getByTestId('list-summary')).toContainText('47.00');

    // 3. 设置餐饮预算 ¥100 -> 记 ¥40 触发 80% 提醒 -> 再记 ¥25 触发超支横幅
    await page.getByRole('link', { name: '我的' }).click();
    await page.getByText('预算设置').click();
    const foodBudgetInput = page.getByTestId('budget-input-food');
    await foodBudgetInput.fill('100');
    await foodBudgetInput.blur();
    await expect(page.getByTestId('toast')).toContainText('已设置餐饮预算');
    await page.screenshot({ path: path.join(SHOTS_DIR, '4-budget.png') });

    await page.getByRole('button', { name: '‹ 返回' }).click();
    await page.getByRole('link', { name: '首页' }).click();

    await page.getByTestId('fab-add').click();
    await page.locator('[data-cat-id="food"]').click();
    for (const k of ['4', '0']) {
      await page.locator(`[data-key="${k}"]`).click();
    }
    await page.locator('[data-key="done"]').click();
    await expect(page.getByTestId('toast')).toContainText('87%');

    await page.getByTestId('fab-add').click();
    await page.locator('[data-cat-id="food"]').click();
    for (const k of ['2', '5']) {
      await page.locator(`[data-key="${k}"]`).click();
    }
    await page.locator('[data-key="done"]').click();
    await expect(page.getByTestId('toast')).toContainText('已超出预算');
    await expect(page.getByTestId('budget-alert-food')).toContainText('已超出预算');
    await expect(page.getByTestId('home-month-total')).toContainText('142.00');
    await page.screenshot({ path: path.join(SHOTS_DIR, '1-home.png') });

    // 4. 导出 CSV -> 清空账单 -> 导入 -> 数据一致
    await page.getByRole('link', { name: '我的' }).click();
    await page.getByText('导入账单 / 备份').click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '导出 CSV' }).click(),
    ]);
    const csvPath = path.join(SHOTS_DIR, 'exported.csv');
    await download.saveAs(csvPath);
    const csvText = await fs.readFile(csvPath, 'utf8');
    expect(csvText).toContain('47.00');
    expect(csvText).toContain('聚餐');

    // 清空 expenses 表并刷新
    await page.evaluate(async () => {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('flowlet-db');
        req.onsuccess = () => {
          const idb = req.result;
          const tx = idb.transaction('expenses', 'readwrite');
          tx.objectStore('expenses').clear();
          tx.oncomplete = () => {
            idb.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    });

    await page.goto('/');
    await expect(page.getByTestId('home-month-total')).toContainText('0.00');

    await page.getByRole('link', { name: '我的' }).click();
    await page.getByText('导入账单 / 备份').click();
    await page.getByTestId('input-import-csv').setInputFiles(csvPath);
    await expect(page.getByTestId('confirm-import-csv')).toContainText('4');
    await page.getByTestId('confirm-import-csv').click();
    await expect(page.getByTestId('toast')).toContainText('成功导入 4 笔支出');

    await page.getByRole('button', { name: '‹ 返回' }).click();
    await page.getByRole('link', { name: '首页' }).click();
    await expect(page.getByTestId('home-month-total')).toContainText('142.00');

    // 5. 离线：等待 Service Worker 就绪 -> 断网刷新仍可打开
    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
    });
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId('home-month-total')).toContainText('142.00');
    await context.setOffline(false);

    expect(pageErrors).toEqual([]);
  });

  test('full feature coverage: again key, edit/delete expense, search & tag filters, category & tag managers, theme & JSON backup', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // 1. 测试「再记」连记两笔 + 昨天日期切换
    await page.getByTestId('fab-add').click();
    await page.locator('[data-cat-id="food"]').click();
    await page.locator('[data-key="2"]').click();
    await page.locator('[data-key="0"]').click();
    await page.getByTestId('note-input').fill('早餐 #日常');
    await page.locator('[data-key="again"]').click();

    // 弹层保持打开，输入已清空，继续记第二笔
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('amount-display')).toHaveText('0');
    await page.locator('[data-cat-id="transport"]').click();
    await page.locator('[data-key="1"]').click();
    await page.locator('[data-key="5"]').click();
    await page.getByTestId('note-input').fill('打车 #通勤');
    await page.locator('[data-key="done"]').click();

    await expect(page.getByTestId('home-month-total')).toContainText('35.00');

    // 2. 点击账单行进入编辑模式 -> 修改金额为 25 -> 保存
    await page.getByText('早餐').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.locator('[data-key="del"]').click();
    await page.locator('[data-key="5"]').click();
    await page.locator('[data-key="done"]').click();
    await expect(page.getByTestId('home-month-total')).toContainText('40.00');

    // 3. 再次点击「打车」-> 两步确认删除
    await page.getByText('打车').click();
    await page.getByRole('dialog').getByText('删除', { exact: true }).click();
    await page.getByRole('dialog').getByText('确认删除', { exact: true }).click();
    await expect(page.getByTestId('home-month-total')).toContainText('25.00');

    // 4. 明细页搜索与标签筛选
    await page.getByRole('link', { name: '明细' }).click();
    const searchInput = page.getByPlaceholder('搜索备注或 #标签');
    await searchInput.fill('不存在的词');
    await expect(page.getByText('没有符合条件的支出记录')).toBeVisible();
    await searchInput.fill('早餐');
    await expect(page.getByText('早餐')).toBeVisible();
    await page.getByRole('button', { name: '清除搜索' }).click();

    // 5. 统计页「年 / 自定义」模式切换与标签下钻
    await page.getByRole('link', { name: '统计' }).click();
    await page.getByRole('tab', { name: '年' }).click();
    await expect(page.getByText('年度支出')).toBeVisible();
    await page.getByRole('tab', { name: '自定义' }).click();
    await expect(page.getByText('区间支出')).toBeVisible();
    await page.getByRole('tab', { name: '月' }).click();
    await page.getByText('日常', { exact: true }).click();
    await expect(page.getByTestId('list-summary')).toContainText('1 笔');

    // 6. 分类管理：新增、编辑、归档、恢复
    await page.getByRole('link', { name: '我的' }).click();
    await page.getByText('分类管理').click();
    await page.getByRole('button', { name: '+ 新增分类' }).click();
    await page.getByPlaceholder('分类名称（如 宠物、咖啡）').fill('奶茶');
    await page.getByRole('button', { name: '🧋' }).click();
    await page.getByRole('button', { name: '添加分类' }).click();
    await expect(page.getByText('奶茶', { exact: true })).toBeVisible();

    // 归档并恢复「奶茶」
    const milkTeaRow = page.locator('.setting-row', { hasText: '奶茶' });
    await milkTeaRow.getByRole('button', { name: '归档' }).click();
    await expect(page.getByText('已归档（1）')).toBeVisible();
    await page.getByRole('button', { name: '恢复' }).click();
    await expect(page.getByText('已归档（1）')).toHaveCount(0);
    await page.getByRole('button', { name: '‹ 返回' }).click();

    // 7. 标签管理：重命名标签
    await page.getByText('标签管理').click();
    await expect(page.getByText('日常', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '重命名' }).click();
    await page.locator('input[type="text"]').fill('早饭');
    await page.getByRole('button', { name: '确定' }).click();
    await expect(page.getByText('早饭', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '‹ 返回' }).click();

    // 8. 外观切换（浅色 / 深色 / 自动）
    await page.getByRole('button', { name: '深色' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: '浅色' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: '自动' }).click();

    // 9. JSON 完整备份导出与恢复
    await page.getByText('导入账单 / 备份').click();
    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '导出 JSON 备份' }).click(),
    ]);
    const jsonPath = path.join(SHOTS_DIR, 'backup.json');
    await jsonDownload.saveAs(jsonPath);
    await expect(page.getByText('上次备份：今天')).toBeVisible();

    await page.getByTestId('input-import-json').setInputFiles(jsonPath);
    await page.getByRole('button', { name: '覆盖恢复' }).click();
    await expect(page.getByTestId('toast')).toContainText('已从备份覆盖恢复');

    expect(pageErrors).toEqual([]);
  });
});
