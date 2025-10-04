// 初始化GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// 节流函数实现
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 能耗对比相关常量（全局变量）
const GPT4_ENERGY = 51773000; // GPT-4单次训练能耗（kWh）
const SHANGHAI_HOUSEHOLD_ENERGY = 31200; // 上海家庭10年用电量（kWh）
const TOTAL_HOUSES = Math.ceil(GPT4_ENERGY / SHANGHAI_HOUSEHOLD_ENERGY); // 总共需要的小房子数量
let houses = []; // 存储小房子元素

// 生成小房子图标
function generateHouseIcons() {
    const container = document.getElementById('housesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    houses = [];
    
    // 计算显示的小房子数量（为了美观，限制在50个以内）
    const displayHouses = Math.min(TOTAL_HOUSES, 50);
    
    for (let i = 0; i < displayHouses; i++) {
        const house = document.createElement('div');
        house.className = 'house-icon lit';
        container.appendChild(house);
        houses.push(house);
    }
}

// 更新小房子状态
function updateHouseState(pue) {
    // PUE=1时没有浪费，PUE>1时产生浪费
    const wasteRatio = Math.max(0, pue - 1);
    
    // 计算浪费的能源相当于多少个家庭10年用电量
    const wastedEnergy = GPT4_ENERGY * wasteRatio;
    const wastedHouses = wastedEnergy / SHANGHAI_HOUSEHOLD_ENERGY;
    
    // 更新小房子显示状态
    const displayHouses = Math.min(TOTAL_HOUSES, 50);
    const darkHouseCount = Math.min(Math.floor(wastedHouses * displayHouses / TOTAL_HOUSES), displayHouses);
    
    houses.forEach((house, index) => {
        if (index < darkHouseCount) {
            house.className = 'house-icon dark';
        } else {
            house.className = 'house-icon lit';
        }
    });
    
    // 更新信息文本
    const wastedHousesInfo = document.getElementById('wastedHousesInfo');
    if (wastedHousesInfo) {
        wastedHousesInfo.textContent = `当前PUE值下，每次GPT4训练一次浪费的能量相当于${wastedHouses.toFixed(1)}个上海家庭10年用电量`;
    }
}

// 创建仪表盘图表
function createGaugeChart(canvasId, value, maxValue, color, label) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // 计算百分比
    const percentage = (value / maxValue) * 100;
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: [
                    color,
                    'rgba(220, 220, 220, 0.3)'
                ],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                },
                datalabels: {
                    display: true,
                    formatter: function() {
                        return label;
                    },
                    color: '#333',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    anchor: 'center',
                    align: 'center'
                }
            },
            rotation: -90,
            circumference: 180
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart) {
                const width = chart.width;
                const height = chart.height;
                const ctx = chart.ctx;
                
                ctx.restore();
                ctx.font = 'bold 28px Arial';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#333';
                ctx.fillText(value.toFixed(3), width / 2, height / 2);
                ctx.save();
            }
        }]
    });
}

// 创建趋势图表
function createTrendChart(canvasId, title, labels, data, color, yLabel) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: color + '20',
                borderColor: color,
                borderWidth: 3,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: color,
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.raw.toLocaleString()} ${yLabel}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 创建柱状图
function createBarChart(canvasId, labels, data, colors, yLabel) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const datasets = [];
    for (let i = 0; i < data.length; i++) {
        datasets.push({
            label: labels[i],
            data: data[i],
            backgroundColor: colors[i],
            borderColor: colors[i],
            borderWidth: 1
        });
    }
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [''],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString()} ${yLabel}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// 初始化数据中心统计图表
function initializeDataCenterCharts() {
    // 初始化PUE仪表盘（最大PUE值为1.7）
    createGaugeChart('pueGauge', 1.196, 1.7, '#4CAF50', 'PUE');
    
    // 初始化WUE仪表盘（最大WUE值为3.0）
    createGaugeChart('wueGauge', 1.216, 3.0, '#2196F3', 'WUE');
    
    // 能耗趋势数据（模拟2025年1-8月数据）
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'];
    const energyData = [16500000, 18200000, 19500000, 20800000, 21500000, 22300000, 23100000, 24000000];
    createTrendChart('energyTrendChart', '能耗趋势', months, energyData, '#F44336', 'kWh');
    
    // 水耗趋势数据（模拟2025年1-8月数据）
    const waterData = [180000, 195000, 205000, 210000, 215000, 220000, 225000, 227499.95];
    createTrendChart('waterTrendChart', '水耗趋势', months, waterData, '#2196F3', '吨');
    
    // 累计能耗对比（实际值 vs 目标值）
    createBarChart('energyComparisonChart', 
        ['2025年累计能耗', '累计总能耗'], 
        [[162990000], [4929200000]], 
        ['#4CAF50', '#FF9800'], 
        'kWh'
    );
    
    // 累计用水量
    createBarChart('waterUsageChart', 
        ['2025年累计用水量', '累计总用水量'], 
        [[1657499.95], [4721972]], 
        ['#2196F3', '#9C27B0'], 
        '吨'
    );
}

// 初始化数据中心实际数据区域的动画
function initializeDataCenterStats() {
    const section = document.getElementById('dataCenterStats');
    const title = section.querySelector('h2');
    const overviewPanel = section.querySelector('.overview-panel');
    const metricsSection = section.querySelector('.metrics-section');
    const chartsSection = section.querySelector('.charts-section');
    const statsGrid = section.querySelector('.stats-grid');
    
    // 初始化图表
    initializeDataCenterCharts();
    
    // 标题动画
    gsap.to(title, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            once: true
        }
    });
    
    // 顶部概览面板动画
    gsap.to(overviewPanel, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            once: true
        }
    });
    
    // 指标区动画
    gsap.to(metricsSection, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.4,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            once: true
        }
    });
    
    // 图表区动画
    gsap.to(chartsSection, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: section,
            start: 'top 50%',
            once: true
        }
    });
    
    // 详细数据统计动画
    gsap.to(statsGrid, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: section,
            start: 'top 40%',
            once: true
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeCharts();
    initializeInteractions();
    initializeDataCenterStats();
});

// 初始化动画
function initializeAnimations() {
    // 第二部分：能耗解剖
    // 标题逐渐显示
    gsap.fromTo("#section2 h2", 
        { opacity: 0, y: -50 },
        {
            opacity: 1,
            y: 0,
            duration: 2,
            ease: "power2.out",
            scrollTrigger: {
                trigger: "#section2",
                start: "top bottom",
                end: "top center",
                scrub: 1
            }
        }
    );

    // 饼图从左侧滑入
    gsap.fromTo(".pie-chart-container", 
        { opacity: 0, x: -100, rotation: -10 },
        {
            opacity: 1,
            x: 0,
            rotation: 0,
            duration: 2,
            ease: "power2.out",
            scrollTrigger: {
                trigger: "#section2",
                start: "top bottom",
                end: "center center",
                scrub: 1
            }
        }
    );

    // PUE滑块从右侧滑入
    gsap.fromTo(".pue-slider-container", 
        { opacity: 0, x: 100, rotation: 10 },
        {
            opacity: 1,
            x: 0,
            rotation: 0,
            duration: 2,
            ease: "power2.out",
            scrollTrigger: {
                trigger: "#section2",
                start: "top bottom",
                end: "center center",
                scrub: 1
            }
        }
    );

    // 添加PUE滑块值的渐进式显示
    gsap.fromTo(".pue-definition, .pue-value, .pue-info, .pue-impact", 
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            stagger: 0.2,
            scrollTrigger: {
                trigger: "#section2",
                start: "center bottom",
                end: "bottom center",
                scrub: 1
            }
        }
    );

    // 为家庭能耗对比区域添加动画
    gsap.to('.house-energy-comparison', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 1.2
    });
}

// 全局变量存储图表实例
let energyChart = null;

// 节流函数，优化拖动时的性能
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 根据PUE值计算能耗构成
function calculateEnergyBreakdown(pueValue) {
    // IT设备能耗占比（相对固定，因为这是核心业务负载）
    const itEnergyPercent = 100 / pueValue;
    
    // 非IT设备能耗占比
    const nonItEnergyPercent = 100 - itEnergyPercent;
    
    // 制冷系统能耗（随PUE值变化最大）
    // PUE越高，制冷系统能耗占比越大
    const coolingRatio = Math.min(0.7, (pueValue - 1.0) * 0.8); // 制冷系统最多占非IT能耗的70%
    const coolingEnergy = nonItEnergyPercent * coolingRatio;
    
    // 供配电系统能耗（相对固定）
    const powerEnergy = nonItEnergyPercent * 0.25; // 占非IT能耗的25%
    
    // 照明及其他能耗（相对固定）
    const otherEnergy = nonItEnergyPercent * 0.05; // 占非IT能耗的5%
    
    // 确保数据合理
    const total = itEnergyPercent + coolingEnergy + powerEnergy + otherEnergy;
    
    return {
        it: Math.round(itEnergyPercent * 10) / 10,
        cooling: Math.round(coolingEnergy * 10) / 10,
        power: Math.round(powerEnergy * 10) / 10,
        other: Math.round(otherEnergy * 10) / 10
    };
}

// 初始化图表
function initializeCharts() {
    // 能耗构成饼图
    const energyCtx = document.getElementById('energyPieChart').getContext('2d');
    const initialPue = 1.54;
    const initialData = calculateEnergyBreakdown(initialPue);
    
    energyChart = new Chart(energyCtx, {
        type: 'doughnut',
        data: {
            labels: ['IT设备与软件', '制冷系统', '供配电系统', '照明及其他'],
            datasets: [{
                data: [initialData.it, initialData.cooling, initialData.power, initialData.other],
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0'
                ],
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'white',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            }
        }
    });
    
    // 初始化后立即应用基于PUE值的颜色
    updateEnergyChart(initialPue);
    
    // 生成小房子图标
    generateHouseIcons();
}

// 更新能耗饼图数据
function updateEnergyChart(pueValue) {
    if (!energyChart) return;
    
    const newData = calculateEnergyBreakdown(pueValue);
    
    // 更新图表数据
    energyChart.data.datasets[0].data = [
        newData.it,
        newData.cooling,
        newData.power,
        newData.other
    ];
    
    // 添加颜色变化效果（根据PUE值调整颜色）
    // IT设备占比高表示节能，用绿色；制冷系统占比高表示耗能，用红色
    const itPercent = newData.it;
    const coolingPercent = newData.cooling;
    
    // IT设备颜色：占比越高越绿（越节能）
    const itHue = 120; // 绿色
    const itSaturation = Math.min(100, 30 + (itPercent - 50) * 1.5);
    
    // 制冷系统颜色：占比越高越红（越耗能）
    const coolingHue = 0; // 红色
    const coolingSaturation = Math.min(100, 30 + coolingPercent * 2);
    
    energyChart.data.datasets[0].backgroundColor = [
        `hsl(${itHue}, ${itSaturation}%, 60%)`,      // IT设备 - 绿色（节能）
        `hsl(${coolingHue}, ${coolingSaturation}%, 60%)`,    // 制冷系统 - 红色（耗能）
        `hsl(45, 70%, 60%)`,     // 供配电 - 黄色（中性）
        `hsl(180, 60%, 60%)`     // 其他 - 青色（中性）
    ];
    
    // 平滑更新图表（拖动时使用更快的更新模式）
    energyChart.update();
}

// 更新滑块颜色
function updateSliderColor(pueValue) {
    const slider = document.getElementById('pueSlider');
    const percentage = ((pueValue - 1.0) / (1.7 - 1.0)) * 100;
    
    // 根据PUE值设置渐变色
    let color1, color2, color3;
    if (pueValue <= 1.25) {
        // 绿色系 - 高效
        color1 = '#4CAF50';
        color2 = '#8BC34A';
        color3 = '#CDDC39';
    } else if (pueValue <= 1.5) {
        // 黄色系 - 中等
        color1 = '#FF9800';
        color2 = '#FFC107';
        color3 = '#FFEB3B';
    } else {
        // 红色系 - 低效
        color1 = '#F44336';
        color2 = '#FF5722';
        color3 = '#FF9800';
    }
    
    slider.style.background = `linear-gradient(to right, ${color1}, ${color2}, ${color3})`;
}

// 创建滑块标记
function createSliderMarkers() {
    const markersContainer = document.getElementById('sliderMarkers');
    if (!markersContainer) return;
    
    // 清空现有标记
    markersContainer.innerHTML = '';
    
    // 关键PUE值及其标签
    const keyPueValues = [
        { value: 1.09, label: '液冷数据中心' },
        { value: 1.196, label: '大同数据中心' },
        { value: 1.25, label: '寒冷地区标准' },
        { value: 1.3, label: '一线城市标准' },
        { value: 1.46, label: '2024平均值' }
    ];
    
    // 计算每个标记的位置
    keyPueValues.forEach(item => {
        const percentage = ((item.value - 1.0) / (1.6 - 1.0)) * 100;
        
        // 创建标记元素（小圆点）
        const marker = document.createElement('div');
        marker.className = 'slider-marker';
        marker.style.left = `${percentage}%`;
        
        // 创建悬停显示的提示框
        const tooltip = document.createElement('div');
        tooltip.className = 'slider-marker-tooltip';
        tooltip.textContent = `${item.value}: ${item.label}`;
        
        // 添加提示框到标记元素
        marker.appendChild(tooltip);
        markersContainer.appendChild(marker);
    });
}

// 更新影响数据
function updateImpactData(pueValue) {
    const data = calculateEnergyBreakdown(pueValue);
    
    // 更新IT设备占比
    const itPercentElement = document.getElementById('itPercent');
    if (itPercentElement) {
        itPercentElement.textContent = data.it + '%';
    }
    
    // 更新制冷系统占比
    const coolingPercentElement = document.getElementById('coolingPercent');
    if (coolingPercentElement) {
        coolingPercentElement.textContent = data.cooling + '%';
    }
    
    // 更新总能耗效率（IT设备占比）
    const efficiencyPercentElement = document.getElementById('efficiencyPercent');
    if (efficiencyPercentElement) {
        efficiencyPercentElement.textContent = data.it + '%';
    }
    
    // 添加数值变化动画
    gsap.to('.impact-value', {
        scale: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
    });
}

// 初始化交互功能
function initializeInteractions() {
    // PUE滑块交互
    const pueSlider = document.getElementById('pueSlider');
    const pueValue = document.getElementById('pueValue');
    const pueInfo = document.getElementById('pueInfo');
    
    // 创建滑块标记
    createSliderMarkers();

    // 拖动过程中实时更新
    pueSlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        updatePueDisplay(value);
    });

    // 鼠标按下时开始实时更新
    pueSlider.addEventListener('mousedown', function() {
        this.addEventListener('mousemove', handlePueChange);
    });

    // 鼠标松开时停止实时更新
    pueSlider.addEventListener('mouseup', function() {
        this.removeEventListener('mousemove', handlePueChange);
        // 添加最终动画效果
        gsap.to(pueValue, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 });
        gsap.to('.pie-chart-container', {
            scale: 1.05,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        });
    });

    // 触摸设备支持
    pueSlider.addEventListener('touchstart', function() {
        this.addEventListener('touchmove', handlePueChange);
    });

    pueSlider.addEventListener('touchend', function() {
        this.removeEventListener('touchmove', handlePueChange);
        // 添加最终动画效果
        gsap.to(pueValue, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 });
        gsap.to('.pie-chart-container', {
            scale: 1.05,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        });
    });

    

    // 统一的PUE值变化处理函数（使用节流优化性能）
    const throttledUpdatePueDisplay = throttle(updatePueDisplay, 16); // 约60fps
    
    function handlePueChange(event) {
        const value = parseFloat(pueSlider.value);
        throttledUpdatePueDisplay(value);
    }

    // 更新PUE显示的函数
    function updatePueDisplay(value) {
        pueValue.textContent = `PUE: ${value.toFixed(2)}`;
        
        // 根据PUE值显示不同信息
        if (value <= 1.09) {
            pueInfo.textContent = '暂时未达到的目标 - 未来理想水平';
            pueInfo.style.color = '#00C853';
        } else if (value <= 1.196) {
            pueInfo.textContent = '液冷数据中心 - 最高效水平';
            pueInfo.style.color = '#2196F3';
        } else if (value <= 1.25) {
            pueInfo.textContent = '大同数据中心 - 行业领先水平';
            pueInfo.style.color = '#4CAF50';
        } else if (value <= 1.3) {
            pueInfo.textContent = '寒冷地区标准 - 绿色数据中心';
            pueInfo.style.color = '#8BC34A';
        } else if (value <= 1.46) {
            pueInfo.textContent = '一线城市标准 - 经济适用水平';
            pueInfo.style.color = '#FF9800';
        } else {
            pueInfo.textContent = '低效率数据中心 - 急需技术改造';
            pueInfo.style.color = '#F44336';
        }

        // 实时更新饼图数据
        updateEnergyChart(value);

        // 根据PUE值改变滑块颜色
        updateSliderColor(value);
        
        // 更新影响数据
        updateImpactData(value);
        
        // 更新小房子状态
        updateHouseState(value);
    }

    // 饼图悬停效果
    const pieCharts = document.querySelectorAll('canvas');
    pieCharts.forEach(canvas => {
        canvas.addEventListener('mouseenter', function() {
            gsap.to(this, { scale: 1.05, duration: 0.3 });
        });
        
        canvas.addEventListener('mouseleave', function() {
            gsap.to(this, { scale: 1, duration: 0.3 });
        });
    });
    
    // 初始化显示 - 确保页面加载时就显示正确的PUE值和家庭能耗对比
    updatePueDisplay(1.46);
}

// 滚动进度指示器
function createScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 4px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        z-index: 1000;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// 初始化滚动进度条
createScrollProgress();

// 添加平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 响应式处理
function handleResize() {
    // 重新计算图表大小
    Chart.helpers.each(Chart.instances, function(chart) {
        chart.resize();
    });
}

window.addEventListener('resize', handleResize);

// 添加键盘导航支持
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        window.scrollBy(0, window.innerHeight);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        window.scrollBy(0, -window.innerHeight);
    }
});