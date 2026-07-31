/** 发现页快捷搜索词（按分类展示） */
export const HOT_KEYWORD_GROUPS = [
  {
    key: 'male',
    label: '男声',
    keywords: [
      '周深',
      '毛不易',
      '张杰',
      '薛之谦',
      '李荣浩',
      '华晨宇',
      '汪苏泷',
      '张远',
      '周杰伦',
      '林俊杰',
      '陈奕迅',
    ],
  },
  {
    key: 'female',
    label: '女声',
    keywords: [
      '单依纯',
      '邓紫棋',
      '周笔畅',
      '张碧晨',
      '袁娅维',
      '希林娜依高',
      '黄霄云',
      '蔡依林',
      '王菲',
      '孙燕姿',
    ],
  },
  {
    key: 'group',
    label: '组合',
    keywords: [
      '时代少年团',
      'TFBOYS',
      '凤凰传奇',
      '告五人',
      '五月天',
    ],
  },
] as const;

export const HOT_KEYWORDS = HOT_KEYWORD_GROUPS.flatMap((group) => group.keywords);
