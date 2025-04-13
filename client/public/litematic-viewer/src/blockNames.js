// 加载中文翻译数据
let zh_cn = {};
let blockNameMap = {};

// 初始化函数，从zh_cn.json加载数据
async function initBlockNames() {
    try {
        const response = await fetch('src/zh_cn.json');
        if (!response.ok) {
            throw new Error(`加载中文翻译文件失败: ${response.status} ${response.statusText}`);
        }
        
        zh_cn = await response.json();
        console.log("成功加载中文翻译数据");
        
        // 初始化映射表
        Object.entries(zh_cn).forEach(([key, value]) => {
            if (key.startsWith('block.minecraft.')) {
                const blockId = key.replace('block.minecraft.', 'minecraft:');
                blockNameMap[blockId] = value;
            }
        });
        
        console.log(`已加载 ${Object.keys(blockNameMap).length} 个方块翻译`);
    } catch (error) {
        console.error("加载中文翻译失败:", error);
        // 如果加载失败，使用基本的映射表作为备用
        blockNameMap = getBasicBlockNames();
    }
}

// 基本的方块名称映射，作为备用
function getBasicBlockNames() {
    return {
        "minecraft:stone": "石头",
        "minecraft:dirt": "泥土",
        "minecraft:grass_block": "草方块",
        "minecraft:cobblestone": "圆石",
        "minecraft:oak_planks": "橡木木板",
        "minecraft:spruce_planks": "云杉木板",
        "minecraft:birch_planks": "白桦木板",
        "minecraft:jungle_planks": "丛林木板",
        "minecraft:acacia_planks": "金合欢木板",
        "minecraft:dark_oak_planks": "深色橡木木板",
        "minecraft:sand": "沙子",
        "minecraft:gravel": "沙砾",
        "minecraft:gold_ore": "金矿石",
        "minecraft:iron_ore": "铁矿石",
        "minecraft:coal_ore": "煤矿石",
        "minecraft:oak_log": "橡木原木",
        "minecraft:oak_leaves": "橡树叶",
        "minecraft:glass": "玻璃",
        "minecraft:lapis_ore": "青金石矿石",
        "minecraft:lapis_block": "青金石块",
        "minecraft:dispenser": "发射器",
        "minecraft:sandstone": "砂岩",
        "minecraft:note_block": "音符盒",
        "minecraft:powered_rail": "动力铁轨",
        "minecraft:detector_rail": "探测铁轨",
        "minecraft:sticky_piston": "粘性活塞",
        "minecraft:cobweb": "蜘蛛网",
        "minecraft:grass": "草",
        "minecraft:piston": "活塞",
        "minecraft:wool": "羊毛",
        "minecraft:yellow_flower": "蒲公英",
        "minecraft:red_flower": "罂粟",
        "minecraft:brown_mushroom": "棕色蘑菇",
        "minecraft:red_mushroom": "红色蘑菇",
        "minecraft:gold_block": "金块",
        "minecraft:iron_block": "铁块",
        "minecraft:stone_slab": "石台阶",
        "minecraft:brick_block": "砖块",
        "minecraft:tnt": "TNT",
        "minecraft:bookshelf": "书架",
        "minecraft:mossy_cobblestone": "苔石",
        "minecraft:obsidian": "黑曜石",
        "minecraft:torch": "火把",
        "minecraft:mob_spawner": "刷怪笼",
        "minecraft:oak_stairs": "橡木楼梯",
        "minecraft:chest": "箱子",
        "minecraft:diamond_ore": "钻石矿石",
        "minecraft:diamond_block": "钻石块",
        "minecraft:crafting_table": "工作台",
        "minecraft:furnace": "熔炉",
        "minecraft:rail": "铁轨",
        "minecraft:lever": "拉杆",
        "minecraft:stone_pressure_plate": "石质压力板",
        "minecraft:redstone_ore": "红石矿石",
        "minecraft:redstone_torch": "红石火把",
        "minecraft:stone_button": "石按钮",
        "minecraft:snow": "雪",
        "minecraft:ice": "冰",
        "minecraft:snow_block": "雪块",
        "minecraft:cactus": "仙人掌",
        "minecraft:clay": "粘土",
        "minecraft:jukebox": "唱片机",
        "minecraft:fence": "橡木栅栏",
        "minecraft:pumpkin": "南瓜",
        "minecraft:netherrack": "下界岩",
        "minecraft:soul_sand": "灵魂沙",
        "minecraft:glowstone": "萤石",
        "minecraft:lit_pumpkin": "南瓜灯",
        "minecraft:cake": "蛋糕",
        "minecraft:repeater": "红石中继器",
        "minecraft:comparator": "红石比较器"
    };
}

// 获取方块的中文名称
function getBlockName(blockId) {
    return blockNameMap[blockId] || blockId.replace('minecraft:', '');
}

// 批量转换物品列表
function convertBlockNames(materials) {
    const result = {};
    for (const [blockId, count] of Object.entries(materials)) {
        const displayName = getBlockName(blockId);
        result[displayName] = count;
    }
    return result;
}

// 页面加载完成后初始化中文翻译数据
document.addEventListener('DOMContentLoaded', initBlockNames); 