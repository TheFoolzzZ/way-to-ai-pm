export type QuestionCategory = {
  id: string;
  name: string;
  sort_order: number;
};

export type QuestionItem = {
  id: string;
  question: string;
  answer: string;
  category_id: string;
  created_at?: string;
  updated_at?: string;
};

export const mockCategories: QuestionCategory[] = [
  { id: "cat-product", name: "产品思维", sort_order: 1 },
  { id: "cat-tech", name: "技术背景", sort_order: 2 },
  { id: "cat-project", name: "项目经历", sort_order: 3 },
  { id: "cat-biz", name: "商业分析", sort_order: 4 },
];

export const mockQuestions: QuestionItem[] = [
  {
    id: "q-product-1",
    category_id: "cat-product",
    question: "如何定义一个好的产品需求？",
    answer: "一个好的产品需求通常满足以下维度：\n\n1. **用户价值清晰**：解决真实痛点，有明确受众。\n2. **业务目标对齐**：能支撑增长、成本或效率目标。\n3. **可交付性**：边界清晰、技术可行、资源可控。\n4. **可度量**：有可验证的成功指标。",
  },
  {
    id: "q-product-2",
    category_id: "cat-product",
    question: "什么是 MVP？如何判断 MVP 成立？",
    answer: "**MVP（最小可行产品）**是以最小成本验证核心假设的版本。判断成立的关键是：\n\n- **假设是否被验证**（用户愿意用、愿意付费或愿意留存）\n- **关键指标是否达标**（转化率、留存、NPS 等）\n- **学习是否足够快**（能指导下一步产品迭代）",
  },
  {
    id: "q-product-3",
    category_id: "cat-product",
    question: "如何开展竞品分析？",
    answer: "推荐四步法：\n\n1. **界定赛道**：明确替代品与直接竞品。\n2. **拆解体验**：场景、流程、功能、交互。\n3. **对齐指标**：对比 DAU、留存、付费、转化。\n4. **提炼洞察**：找出差异化机会与改进点。",
  },
  {
    id: "q-tech-1",
    category_id: "cat-tech",
    question: "如何评估一个需求的技术可行性？",
    answer: "从三个维度判断：\n\n- **复杂度**：是否涉及新架构或高耦合模块。\n- **性能风险**：高并发、低延迟场景是否可达。\n- **交付成本**：人力、周期、依赖是否可控。\n\n通常会通过技术评审 + PoC 验证。",
  },
  {
    id: "q-tech-2",
    category_id: "cat-tech",
    question: "一次系统性能瓶颈是怎么定位的？",
    answer: "**定位思路**：\n\n1. 指标监控 → 确认瓶颈区间（CPU/IO/DB）。\n2. 链路追踪 → 锁定高延迟接口。\n3. 压测复现 → 评估峰值与边界。\n4. 优化回归 → 验证改动效果。",
  },
  {
    id: "q-tech-3",
    category_id: "cat-tech",
    question: "前后端协作中如何减少返工？",
    answer: "核心是：**需求边界清晰 + 验收标准明确**。\n\n- 用接口契约 + 字段说明统一认知。\n- 关键交互使用原型或动效说明。\n- 评审时以异常场景为主。",
  },
  {
    id: "q-project-1",
    category_id: "cat-project",
    question: "描述一个失败的项目，你学到了什么？",
    answer: "**失败原因**：需求范围过大、验证过晚、资源不足。\n\n**经验总结**：\n\n- 提前拆分 MVP，先验证核心价值。\n- 建立风险清单，设定止损机制。\n- 关键假设要用数据验证。",
  },
  {
    id: "q-project-2",
    category_id: "cat-project",
    question: "如何推动跨部门协作？",
    answer: "关键在于：\n\n- **对齐共同目标**（指标 + 结果）\n- **明确角色与责任**（RACI）\n- **建立节奏与机制**（例会、同步文档）\n- **提供可见的收益**（让协作方有成就）",
  },
  {
    id: "q-project-3",
    category_id: "cat-project",
    question: "需求优先级如何排序？",
    answer: "常用框架：\n\n- **价值/成本矩阵**\n- **RICE**（Reach, Impact, Confidence, Effort）\n- **Kano**（基础型、期望型、兴奋型）\n\n结合当前阶段与资源约束做最终决策。",
  },
  {
    id: "q-biz-1",
    category_id: "cat-biz",
    question: "如何测算 LTV？",
    answer: "常见公式：\n\n**LTV = ARPU × 毛利率 × 平均生命周期**。\n\n要特别注意生命周期的估算与留存率的稳定性。",
  },
  {
    id: "q-biz-2",
    category_id: "cat-biz",
    question: "你会如何制定增长策略？",
    answer: "遵循 AARRR 模型：\n\n1. Acquisition 获取\n2. Activation 激活\n3. Retention 留存\n4. Revenue 收入\n5. Referral 传播\n\n先聚焦瓶颈环节，再做实验迭代。",
  },
  {
    id: "q-biz-3",
    category_id: "cat-biz",
    question: "如何评估一个商业模式是否可持续？",
    answer: "核心指标包括：\n\n- **Unit Economics** 是否正向\n- **CAC vs LTV** 是否匹配\n- **规模效应** 是否随着增长改善\n- **壁垒** 是否能防止被复制",
  },
];
