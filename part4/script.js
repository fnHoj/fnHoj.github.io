// 当整个HTML文档加载并解析完成后，执行此函数
document.addEventListener('DOMContentLoaded', function () {
    // ===== 数据定义 =====

    // 存储各个聚变装置的核心性能参数
    const fusionData = {
        'T-3': { name: 'T-3 (苏联)', tripleProduct: 2.0e16, temperature: 0.3, qValue: null, pulseDuration: 0.01, magneticField: 3.5 },
        'TFTR': { name: 'TFTR (美国)', tripleProduct: 7.9e20, temperature: 43, qValue: 0.27, pulseDuration: 1, magneticField: 5.9 },
        'JET': { name: 'JET (欧洲)', tripleProduct: 4.7e20, temperature: 28, qValue: 0.67, pulseDuration: 5, magneticField: 4 },
        'JT-60U': { name: 'JT-60U (日本)', tripleProduct: 1.53e21, temperature: 16.8, qValue: 1.25, pulseDuration: 65, magneticField: 4 },
        'ASDEX Upgrade': { name: 'ASDEX Upgrade (德国)', tripleProduct: 2.2e19, temperature: 8, qValue: null, pulseDuration: 10, magneticField: 3.2 },
        'EAST': { name: 'EAST (中国)', tripleProduct: 9.6e18, temperature: 2.1, qValue: null, pulseDuration: 1056, magneticField: 3.5 },
        'W7-X': { name: 'W7-X (德国)', tripleProduct: 6.2e19, temperature: null, qValue: null, pulseDuration: null, magneticField: null },
        'WEST': { name: 'WEST (法国)', tripleProduct: null, temperature: 4.3, qValue: null, pulseDuration: 1337, magneticField: 3.7 },
        'HL-2M': { name: 'HL-2M (中国)', tripleProduct: 1e20, temperature: 10, qValue: null, pulseDuration: 10, magneticField: 2.2 },
        'NIF': { name: 'NIF (美国)', tripleProduct: 5.2e21, temperature: null, qValue: 4.13, pulseDuration: null, magneticField: null },
        'ITER': { name: 'ITER (国际)', tripleProduct: 6e21, temperature: 13, qValue: 10, pulseDuration: 400, magneticField: 5.3 }
    };
    
    // 描述每个装置解决了哪些技术瓶颈 (solves)，以及揭示了哪些新的挑战 (reveals)
    const bottleneckInfo = {
        'T-3': { solves: [1], reveals: [2] },
        'TFTR': { solves: [2], reveals: [4] },
        'JET': { solves: [2], reveals: [4] },
        'JT-60U': { solves: [3], reveals: [3] },
        'ASDEX Upgrade': { solves: [4], reveals: [4] },
        'EAST': { solves: [3], reveals: [3, 4] },
        'W7-X': { solves: [3], reveals: [4] },
        'WEST': { solves: [4], reveals: [4] },
        'HL-2M': { solves: [2, 4], reveals: [5] },
        'NIF': { solves: [5], reveals: [5] },
        'ITER': { solves: [5], reveals: [6] } 
    };

    // 定义装置的出现顺序，这是整个故事线和动画的基础
    const deviceOrder = ['T-3', 'TFTR', 'JET', 'JT-60U', 'ASDEX Upgrade', 'EAST', 'W7-X', 'WEST', 'HL-2M', 'NIF', 'ITER'];
    // 为每个装置分配一个颜色
    const deviceColors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#e6beff', '#f032e6', '#808000', '#008080'];
    // 定义需要可视化的指标及其属性（标签、单位、是否使用对数坐标）
    const metrics = {
        tripleProduct: { label: '聚变三重积', unit: 'm⁻³·s·keV', log: true },
        pulseDuration: { label: '脉冲持续时间', unit: 's', log: true },
        temperature: { label: '等离子体温度', unit: 'keV', log: false },
        qValue: { label: 'Q值', unit: '', log: false },
        magneticField: { label: '磁场', unit: 'T', log: false }
    };
    let highlightedDevice = null; // 跟踪当前被图例点击高亮的设备

    /**
     * 格式化数值以便显示
     * @param {number|null} value - 原始数值
     * @param {string} key - 指标的键名
     * @returns {string} 格式化后的字符串
     */
    function formatValue(value, key) {
        if (value === null || value === undefined) return "N/A";
        if (key === 'tripleProduct') return value.toExponential(1); // 科学计数法
        if (value > 100) return Math.round(value).toLocaleString(); // 大于100取整
        if (value < 1 && value > 0) return value.toFixed(2); // 小于1保留两位小数
        return value.toLocaleString(); // 其他情况正常显示
    }

    /**
     * 预处理数据：计算每个数据点在图表中的相对宽度（百分比）
     * 对于log为true的指标，使用对数尺度计算，以更好地展示数量级差异巨大的数据
     */
    function preprocessData() {
        for (const key in metrics) {
            const isLog = metrics[key].log;
            // 过滤掉无效值，找到最大最小值
            const values = deviceOrder.map(d => fusionData[d][key]).filter(v => v !== null && v > 0);
            if (values.length === 0) continue;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            deviceOrder.forEach(deviceKey => {
                const value = fusionData[deviceKey][key];
                if (value === null || value <= 0) {
                    fusionData[deviceKey][`${key}_width`] = 0; return;
                }
                // 根据是否为对数尺度，计算宽度百分比
                let width = (isLog)
                    ? (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min)) * 100
                    : Math.max(0.5, (value / max) * 100); // 线性尺度，保证最小可见宽度
                fusionData[deviceKey][`${key}_width`] = Math.max(0, width); // 确保宽度不为负
            });
        }
    }
    
    /**
     * 动态创建可视化图表的HTML结构
     */
    function createVisuals() {
        const container = document.getElementById('viz-container');
        container.innerHTML = '';
        const numDevices = deviceOrder.length;
        const barHeight = 100 / numDevices; // 每个条形的高度

        for (const key in metrics) {
            const metric = metrics[key];
            // 为每个指标创建一个图表组
            let groupHtml = `
                <div class="metric-group" id="metric-${key}">
                    <div class="metric-info">
                        <h3>${metric.label}</h3>
                        <span class="metric-value"></span>
                    </div>
                    <div class="bars-container">
            `;
            // 在图表组内为每个装置创建一个条形
            deviceOrder.forEach((deviceKey, i) => {
                const color = deviceColors[i % deviceColors.length];
                const topPosition = i * barHeight;
                groupHtml += `<div class="bar" 
                                   data-metric="${key}" 
                                   data-device="${deviceKey}" 
                                   style="background-color: ${color}; top: ${topPosition}%; height: ${barHeight}%;">
                              </div>`;
            });
            groupHtml += `</div></div>`;
            container.innerHTML += groupHtml;
        }
    }

    /**
     * 动态创建图例的HTML结构
     */
    function createLegend() {
        const container = document.querySelector('.legend-container');
        let html = '';
        deviceOrder.forEach((key, i) => {
            const deviceName = fusionData[key].name.split(' ')[0];
            html += `
                <div class="legend-item" data-device="${key}">
                    <span class="legend-color" style="background-color: ${deviceColors[i]}"></span>
                    ${deviceName}
                </div>
            `;
        });
        container.innerHTML = html;
    }

    /**
     * 高亮指定的装置，并暗淡其他装置
     * @param {string} deviceKey - 要高亮的装置的键名
     */
    function highlightDevice(deviceKey) {
        document.querySelectorAll('.bar').forEach(bar => {
            bar.classList.remove('highlight', 'dimmed');
            if (deviceKey) {
                if (bar.dataset.device === deviceKey) {
                    bar.classList.add('highlight');
                } else {
                    bar.classList.add('dimmed');
                }
            }
        });
        document.querySelectorAll('.legend-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.device === deviceKey) {
                item.classList.add('active');
            }
        });
    }
    
    /**
     * 清除所有高亮和暗淡效果
     */
    function clearAllHighlights() {
        document.querySelectorAll('.bar').forEach(bar => bar.classList.remove('highlight', 'dimmed'));
        document.querySelectorAll('.legend-item').forEach(item => item.classList.remove('active'));
    }

    /**
     * 为图例项设置点击交互事件
     */
    function setupLegendInteractions() {
        document.querySelectorAll('.legend-item').forEach(item => {
            item.addEventListener('click', () => {
                const deviceKey = item.dataset.device;
                // 点击已高亮的图例项则取消高亮，否则高亮新点击的项
                if (highlightedDevice === deviceKey) {
                    highlightedDevice = null;
                    clearAllHighlights();
                } else {
                    highlightedDevice = deviceKey;
                    highlightDevice(deviceKey);
                }
            });
        });
    }

    /**
     * 根据当前滚动到的装置，更新可视化图表
     * @param {number} activeIndex - 当前激活装置在 `deviceOrder` 数组中的索引
     */
    function updateVisuals(activeIndex) {
        const activeDeviceKey = deviceOrder[activeIndex];
        // 更新所有条形的宽度
        document.querySelectorAll('.bar').forEach(bar => {
            const deviceKey = bar.dataset.device;
            const deviceIndex = deviceOrder.indexOf(deviceKey);
            // 只显示当前及之前装置的条形
            bar.style.width = (deviceIndex <= activeIndex) 
                ? `${fusionData[deviceKey][`${bar.dataset.metric}_width`]}%` 
                : '0%';
        });
        
        // 更新每个指标旁边的数值显示
        for (const key in metrics) {
            const valueEl = document.querySelector(`#metric-${key} .metric-value`);
            const value = fusionData[activeDeviceKey][key];
            const unit = metrics[key].unit;
            valueEl.textContent = `${formatValue(value, key)} ${unit}`;
            
            // 使用'重绘'技巧来触发CSS动画
            valueEl.classList.remove('visible');
            void valueEl.offsetWidth; // 强制浏览器重绘
            valueEl.classList.add('visible');
        }
    }
    
    /**
     * 根据当前滚动到的装置，更新技术瓶颈追踪器的状态
     * @param {number} activeIndex - 当前激活装置在 `deviceOrder` 数组中的索引
     */
    function updateBottlenecks(activeIndex) {
        const activeDeviceKey = deviceOrder[activeIndex];
        const revealedByCurrent = bottleneckInfo[activeDeviceKey].reveals;

        // 创建一个集合，包含到当前装置为止所有被解决过的瓶颈
        const solvedSet = new Set();
        for (let i = 0; i <= activeIndex; i++) {
            const deviceKey = deviceOrder[i];
            bottleneckInfo[deviceKey].solves.forEach(s => solvedSet.add(s));
        }

        document.querySelectorAll('.bottleneck-item').forEach(item => {
            const bottleneckId = parseInt(item.dataset.bottleneck, 10);
            
            item.classList.remove('status-inactive', 'status-unlocked', 'status-solved');

            // 逻辑判断：
            // 1. 如果这个瓶颈已经被解决（在 solvedSet 中），则标记为'solved'
            if (solvedSet.has(bottleneckId)) {
                 item.classList.add('status-solved');
            }
            // 2. 如果没被解决，但被当前装置新揭示出来，则标记为'unlocked'
            else if (revealedByCurrent.includes(bottleneckId)) {
                item.classList.add('status-unlocked');
            } 
            // 3. 否则，它就是'inactive'状态
            else {
                 item.classList.add('status-inactive');
            }
        });
    }

    /**
     * 设置鼠标悬浮在条形图上时显示提示框的功能
     */
    function setupTooltip() {
        const tooltip = document.getElementById('tooltip');
        document.querySelectorAll('.bar').forEach(bar => {
            bar.addEventListener('mouseenter', (event) => {
                const deviceKey = event.target.dataset.device;
                const metricKey = event.target.dataset.metric;
                const device = fusionData[deviceKey];
                const metric = metrics[metricKey];
                
                const value = device[metricKey];
                tooltip.style.display = 'block';
                tooltip.innerHTML = `<strong>${device.name}</strong><br>${metric.label}: ${formatValue(value, metricKey)} ${metric.unit}`;
            });
            
            bar.addEventListener('mousemove', (event) => {
                tooltip.style.left = `${event.pageX + 15}px`;
                tooltip.style.top = `${event.pageY + 15}px`;
            });
            
            bar.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    }

    // ===== 滚动监听与主逻辑 =====

    const sections = document.querySelectorAll('.text-section');
    // 创建一个 IntersectionObserver 来监测文本卡片何时进入视窗的特定区域
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // 当卡片进入我们定义的触发区域时
            if (entry.isIntersecting) {
                const activeDeviceKey = entry.target.dataset.device;
                const activeIndex = deviceOrder.indexOf(activeDeviceKey);
                // 更新样式和图表
                sections.forEach(sec => sec.classList.remove('is-active'));
                entry.target.classList.add('is-active');
                updateVisuals(activeIndex);
                updateBottlenecks(activeIndex); 
            }
        });
    }, { 
        // rootMargin 定义了触发区域。'-48% 0px -48% 0px' 意味着只有当元素进入视窗垂直中间的 4% 区域时，才被视为'intersecting'
        rootMargin: '-48% 0px -48% 0px', 
        threshold: 0 
    });
    // 让 observer 开始监测所有文本卡片
    sections.forEach(section => observer.observe(section));

    // ===== 初始化 =====
    
    // 页面加载后立即执行的初始化步骤
    preprocessData();       // 1. 准备数据
    createVisuals();        // 2. 创建图表HTML
    createLegend();         // 3. 创建图例HTML
    setupTooltip();         // 4. 设置提示框
    setupLegendInteractions(); // 5. 设置图例交互
    
    // 手动初始化第一个装置的显示状态，确保页面加载时不是空白
    const firstSection = document.querySelector('.text-section');
    if (firstSection) {
        const firstDeviceKey = firstSection.dataset.device;
        const firstIndex = deviceOrder.indexOf(firstDeviceKey);
        firstSection.classList.add('is-active');
        updateVisuals(firstIndex);
        updateBottlenecks(firstIndex);
    }
});