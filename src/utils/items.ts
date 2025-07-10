import figureNames from "@/assets/figureName.json";

/**
 * 获取所有物品的英文名称列表
 */
export const itemEnglishNames: string[] = figureNames.map(item => item.englishName);

export default itemEnglishNames;