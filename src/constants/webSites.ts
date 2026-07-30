export interface WebSite {
  id: string;
  name: string;
  url: string;
  hint: string;
}

/** 应用内直接嵌入的第三方音乐站点 */
export const WEB_SITES: WebSite[] = [
  {
    id: 'gdstudio',
    name: 'GD Studio',
    url: 'https://music.gdstudio.org/',
    hint: 'GD Music 网页版',
  },
  {
    id: 'qqmp3',
    name: 'QQMP3',
    url: 'https://www.qqmp3.vip/',
    hint: 'QQMP3 网页版',
  },
];
