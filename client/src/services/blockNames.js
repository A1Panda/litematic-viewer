import zh_cn from '../zh_cn.json';

// 创建物品ID到中文名称的映射
const blockNameMap = new Map();

// 初始化映射表
Object.entries(zh_cn).forEach(([key, value]) => {
    if (key.startsWith('block.minecraft.')) {
        const blockId = key.replace('block.minecraft.', 'minecraft:');
        blockNameMap.set(blockId, value);
    }
});

// 获取物品的中文名称
export const getBlockName = (blockId) => {
    return blockNameMap.get(blockId) || blockId;
};

// 批量转换物品列表
export const convertBlockNames = (materials) => {
    return materials.map(material => ({
        ...material,
        displayName: getBlockName(material.blockId)
    }));
}; 