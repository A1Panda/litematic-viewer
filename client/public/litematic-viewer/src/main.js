var structureLitematic;

function loadAndProcessFile(file) {
   
   if (deepslateResources == null) {return;}

   // Remove input form to stop people submitting twice
   const elem = document.getElementById('file-loader-panel');
   elem.parentNode.removeChild(elem);
      
   let reader = new FileReader();
   reader.readAsArrayBuffer(file);
   reader.onload = function(evt) {

      //var buffer = new Uint8Array(reader.result);
      //console.log(buffer);

      const nbtdata = deepslate.readNbt(new Uint8Array(reader.result));//.result; // Don't care about .compressed
      console.log("Loaded litematic with NBT data:")
      console.log(nbtdata.value);
      structureLitematic = readLitematicFromNBTData(nbtdata);
      
      createRenderCanvas();

      //Create sliders
      const max_y = structureLitematic.regions[0].blocks[0].length;
      createRangeSliders(max_y);

      const blockCounts = getMaterialList(structureLitematic);
      createMaterialsList(blockCounts);

      setStructure(structureFromLitematic(structureLitematic), reset_view=true);

   };
   reader.onerror = function() {
      console.log(reader.error);
   };
   
}

function createMaterialsList(blockCounts) {
   const materialList = document.getElementById('materialList');
   const materialHeader = materialList.querySelector('.material-header');
   
   // 使用blockNames.js中的convertBlockNames函数转换成中文
   const chineseBlockCounts = convertBlockNames(blockCounts);

   // 清除旧内容，保留头部
   while (materialList.lastChild !== materialHeader) {
     materialList.removeChild(materialList.lastChild);
   }

   // 计算总方块数量
   const totalCount = Object.values(chineseBlockCounts).reduce((a, b) => a + b, 0);
   const totalTypes = Object.keys(chineseBlockCounts).length;
   
   // 添加总计信息
   const totalInfo = document.createElement('div');
   totalInfo.className = 'total-info';
   totalInfo.innerHTML = `<div>总方块数: <strong>${totalCount}</strong></div><div>方块种类: <strong>${totalTypes}</strong></div>`;
   materialList.appendChild(totalInfo);
   
   // 添加分割线
   const divider = document.createElement('div');
   divider.className = 'material-divider';
   materialList.appendChild(divider);

   // 添加材料列表项
   Object.entries(chineseBlockCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([key, val]) => {
       const item = document.createElement('div');
       item.className = 'count-item';
       item.innerHTML = `<span>${key}</span><span>${val}</span>`;
       materialList.appendChild(item);
    });
    
   materialList.style.display = 'none';

   const materialListButton = document.getElementById('materialListButton');
   materialListButton.style.display = 'block';

   materialListButton.onclick = () => materialList.style.display = materialList.style.display === 'none' ? 'block' : 'none';

   // 添加下载按钮到头部
   if (!materialHeader.querySelector('.material-button')) {
      const downloadBtn = document.createElement('button');
      downloadBtn.innerHTML = '<span class="material-icons">download</span>';
      downloadBtn.className = 'material-button';
      downloadBtn.title = '下载材料列表';
      downloadBtn.onclick = () => downloadMaterialsCSV(chineseBlockCounts);
      materialHeader.appendChild(downloadBtn);
   }
}

function downloadMaterialsCSV(blockCounts) {
   // 使用中文名称导出CSV
   const csvContent = Object.entries(blockCounts)
   .sort(([,a], [,b]) => b - a)
   .map(([key, val]) => `${key},${val}`)
   .join('\n');

   const blob = new Blob([csvContent], { type: 'text/csv' });
   const url = window.URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = 'MaterialList.csv';
   a.click();
   window.URL.revokeObjectURL(url);
}

function createRangeSliders(max_y) {
   const slidersDiv = document.getElementById('sliders');
   slidersDiv.style.display = "block";

   const minSlider = document.createElement('input');
   minSlider.type = 'range';
   minSlider.id = 'miny';
   minSlider.min = 0;
   minSlider.max = max_y;
   minSlider.value = 0;
   minSlider.step = 1;

   const maxSlider = document.createElement('input');
   maxSlider.type = 'range';
   maxSlider.id = 'maxy';
   maxSlider.min = 0;
   maxSlider.max = max_y;
   maxSlider.value = max_y-1;
   maxSlider.step = 1;

   var y_min = 0;
   var y_max = max_y;

   minSlider.addEventListener('change', function(e) {
      y_min = e.target.value;
      console.log(y_min);
      setStructure(structureFromLitematic(structureLitematic, y_min=y_min, y_max=y_max));
   });

   maxSlider.addEventListener('change', function(e) {
      y_max = e.target.value;
      console.log(y_max);
      setStructure(structureFromLitematic(structureLitematic, y_min=y_min, y_max=y_max));
   });

   slidersDiv.appendChild(minSlider);
   slidersDiv.appendChild(maxSlider);
}
