var structureLitematic;
// 添加resourcesLoaded变量，默认为false
window.resourcesLoaded = false;

// 添加window.onload事件来设置资源已加载
window.onload = function() {
    console.log("Window loaded, checking deepslateResources");
    
    // 检查deepslateResources是否已加载
    function checkDeepslateResources() {
        if (window.deepslate && window.deepslateResources) {
            console.log("Deepslate资源已加载，设置resourcesLoaded = true");
            window.resourcesLoaded = true;
        } else {
            console.log("等待Deepslate资源加载...");
            setTimeout(checkDeepslateResources, 300);
        }
    }
    
    // 开始检查
    checkDeepslateResources();
};

function loadAndProcessFileInternal(file) {
   
   if (window.deepslateResources == null) {
      console.error("deepslateResources为null，无法处理文件");
      return;
   }

   // Remove input form to stop people submitting twice
   const elem = document.getElementById('file-loader-panel');
   if (elem) {
      elem.parentNode.removeChild(elem);
   }
      
   let reader = new FileReader();
   reader.readAsArrayBuffer(file);
   reader.onload = function(evt) {

      //var buffer = new Uint8Array(reader.result);
      //console.log(buffer);

      try {
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
      } catch (err) {
         console.error("处理litematic文件时出错:", err);
      }

   };
   reader.onerror = function() {
      console.error("读取文件错误:", reader.error);
   };
   
}

function createMaterialsList(blockCounts) {
   const materialList = document.getElementById('materialList');

   materialList.innerHTML = Object.entries(blockCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([key, val]) => `<div class="count-item"><span>${key.replace('minecraft:', '')}</span><span>${val}</span></div>`)
    //.map(([key, val]) => `<tr><td>${key}</td><td>${val}</td></tr>`)
    .join('');
   materialList.style.display = 'none';

   const materialListButton = document.getElementById('materialListButton');
   materialListButton.style.display = 'block';
   //materialListButton.onmouseover = () => materialList.style.display = 'block';
   //materialListButton.onmouseout = () => materialList.style.display = 'none';

   materialListButton.onclick = () => materialList.style.display = materialList.style.display === 'none' ? 'block' : 'none';

   function downloadMaterialsCSV() {
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

   // Add download button
   const downloadBtn = document.createElement('button');
   downloadBtn.innerHTML = '<span class="material-icons">download</span>';
   downloadBtn.className = 'material-button';
   downloadBtn.onclick = downloadMaterialsCSV;
   materialList.appendChild(downloadBtn);

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

// 添加unloadSchematic函数，用于清理资源
function unloadSchematic() {
    console.log("正在清理litematic资源...");
    
    // 如果存在相关的DOM元素，则恢复它们
    const viewerElement = document.getElementById('viewer');
    if (viewerElement) {
        // 移除所有子元素
        while (viewerElement.firstChild) {
            viewerElement.removeChild(viewerElement.firstChild);
        }
    }
    
    // 移除材料列表
    const materialList = document.getElementById('materialList');
    if (materialList) {
        materialList.innerHTML = '';
        materialList.style.display = 'none';
    }
    
    // 隐藏材料列表按钮
    const materialListButton = document.getElementById('materialListButton');
    if (materialListButton) {
        materialListButton.style.display = 'none';
    }
    
    // 清理滑块
    const slidersDiv = document.getElementById('sliders');
    if (slidersDiv) {
        slidersDiv.innerHTML = '';
        slidersDiv.style.display = 'none';
    }
    
    // 将全局变量置空
    structureLitematic = null;
    
    // 如果有深度渲染器，尝试销毁它
    if (deepslateRenderer) {
        try {
            // 调用任何必要的清理方法
            deepslateRenderer = null;
        } catch (e) {
            console.error('清理渲染器时出错:', e);
        }
    }
    
    console.log("litematic资源已清理完成");
    return true;
}

// 将函数暴露给window对象，这样外部iframe可以调用它
window.unloadSchematic = unloadSchematic;
