gsap.registerPlugin(ScrollTrigger);

// 能耗对比相关常量（全局变量）
const GPT4_ENERGY = 51773000; // GPT-4单次训练能耗（kWh）
const SHANGHAI_HOUSEHOLD_ENERGY = 31200; // 上海家庭10年用电量（kWh）
const TOTAL_HOUSES = Math.ceil(GPT4_ENERGY / SHANGHAI_HOUSEHOLD_ENERGY); // 总共需要的小房子数量
let houses = []; // 存储小房子元素
let energyChart = null; // 全局变量存储能耗饼图实例

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeCharts();
    createScrollProgress();
    addSmoothScroll();
    handleResize();
    addKeyboardNavigation();
    setupVisualizationSwitching(); // 添加可视化切换逻辑
    initializeTask2Visualization(); // 初始化任务2的可视化内容
});

// 初始化动画
function initializeAnimations() {
    // 为所有章节添加动画
    const sections = document.querySelectorAll('.section');
    
    sections.forEach((section, index) => {
        const textContent = section.querySelector('.text-content');
        const title = section.querySelector('h2');
        const textModules = section.querySelectorAll('.text-module, .cooling-tech-module');
        
        // 标题动画
        if (title) {
            gsap.fromTo(title,
                { opacity: 0, y: -30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                        once: true
                    }
                }
            );
        }
        
        // 文字内容动画 - 最后三页使用居中动画
        if (textContent && index >= 3 && index <= 5) { // 最后三页（索引3、4、5对应section4、5、6）
            gsap.fromTo(textContent,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 70%",
                        once: true
                    }
                }
            );
        } else if (textContent) {
            // 其他页面保持原有的左侧进入动画
            gsap.fromTo(textContent,
                { opacity: 0, x: -50 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 1.2,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 70%",
                        once: true
                    }
                }
            );
        }
        
        // 文字模块逐个显示动画
        if (textModules.length > 0) {
            gsap.fromTo(textModules,
                { opacity: 0, y: 20 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    stagger: 0.2,
                    scrollTrigger: {
                        trigger: section,
                        start: "top 60%",
                        once: true
                    }
                }
            );
        }
    });
    
    // 为任务2的可视化部分添加动画
    const task2Section = document.querySelector('#section2:last-of-type');
    if (task2Section) {
        const title = task2Section.querySelector('h2');
        const energySection = task2Section.querySelector('.energy-breakdown-section');
        const houseComparison = task2Section.querySelector('.house-energy-comparison');
        
        if (title) {
            gsap.fromTo(title,
                { opacity: 0, y: -30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: task2Section,
                        start: "top 80%",
                        once: true
                    }
                }
            );
        }
        
        if (energySection) {
            gsap.fromTo(energySection,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: task2Section,
                        start: "top 70%",
                        once: true
                    }
                }
            );
        }
        
        if (houseComparison) {
            gsap.fromTo(houseComparison,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    delay: 0.3,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: task2Section,
                        start: "top 60%",
                        once: true
                    }
                }
            );
        }
    }
}

// 初始化图表
function initializeCharts() {
    // 第一章节：场景-功能关联图
    if (document.getElementById('scenario-function-chart')) {
        createScenarioFunctionChart();
    }
    
    // 第二章节：传统数据中心能耗饼图
    if (document.getElementById('traditional-energy-chart')) {
        createTraditionalEnergyChart();
    }
    
    // 第三章节：冷却系统对比图
    if (document.getElementById('cooling-comparison-chart')) {
        createCoolingComparisonChart();
    }
}

// 创建场景-功能关联图
function createScenarioFunctionChart() {
    const ctx = document.createElement('canvas');
    document.getElementById('scenario-function-chart').appendChild(ctx);
    
    const data = {
        labels: ['数据存储', '计算支撑', '业务保障'],
        datasets: [
            {
                label: '企业应用',
                data: [90, 75, 85],
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            },
            {
                label: '政务服务',
                data: [95, 65, 90],
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: '个人服务',
                data: [80, 85, 70],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }
        ]
    };
    
    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '数据中心功能与应用场景关联度',
                    font: {
                        size: 18
                    },
                    color: '#f8fafc'
                },
                legend: {
                    position: 'top',
                    labels: {
                        color: '#f8fafc'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: '关联度 (%)',
                        color: '#f8fafc'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#f8fafc'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#f8fafc'
                    }
                }
            }
        }
    };
    
    new Chart(ctx, config);
}

// 创建传统数据中心能耗饼图
function createTraditionalEnergyChart() {
    const ctx = document.createElement('canvas');
    document.getElementById('traditional-energy-chart').appendChild(ctx);
    
    const data = {
        labels: ['IT设备', '冷却系统', '电气系统', '其他能耗'],
        datasets: [{
            data: [45, 40, 5, 10],
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1,
            cutout: '65%'
        }]
    };
    
    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    },
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc'
                },
                datalabels: {
                    display: true,
                    formatter: function(value) {
                        return value + '%';
                    },
                    color: '#f8fafc'
                }
            }
        },
        plugins: [ChartDataLabels]
    };
    
    new Chart(ctx, config);
}



// 创建冷却系统对比图
function createCoolingComparisonChart() {
    const ctx = document.createElement('canvas');
    document.getElementById('cooling-comparison-chart').appendChild(ctx);
    
    const data = {
        labels: ['PUE水平', '节能效率', '适用功率', '初期投入', '维护难度'],
        datasets: [
            {
                label: '全时自然冷',
                data: [85, 90, 40, 95, 70],
                backgroundColor: 'rgba(75, 192, 75, 0.6)',
                borderColor: 'rgba(75, 192, 75, 1)',
                borderWidth: 1
            },
            {
                label: '冷板式液冷',
                data: [90, 75, 75, 60, 60],
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: '浸没式液冷',
                data: [98, 95, 98, 30, 30],
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }
        ]
    };
    
    const config = {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '三种冷却技术对比',
                    font: {
                        size: 18
                    },
                    color: '#f8fafc'
                },
                legend: {
                    position: 'top',
                    labels: {
                        color: '#f8fafc'
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        color: '#f8fafc'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#f8fafc'
                    }
                }
            }
        }
    };
    
    new Chart(ctx, config);
}

// 设置可视化切换逻辑
function setupVisualizationSwitching() {
    const sections = document.querySelectorAll('.section:not(:last-of-type)'); // 排除最后一个任务2的section
    const visualizationPanels = document.querySelectorAll('.visualization-panel');
    
    // 默认显示第一个可视化面板
    if (visualizationPanels.length > 0) {
        visualizationPanels[0].classList.add('active');
    }
    
    // 监听滚动事件，当滚动到新章节时切换可视化内容
    window.addEventListener('scroll', throttle(() => {
        const scrollPosition = window.scrollY + window.innerHeight / 3;
        
        // 找到当前滚动位置对应的章节
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            const sectionTop = section.offsetTop;
            
            if (scrollPosition >= sectionTop) {
                // 隐藏所有可视化面板
                visualizationPanels.forEach(viz => {
                    viz.classList.remove('active');
                    gsap.to(viz, { opacity: 0, duration: 0.5 });
                });
                
                // 显示对应章节的可视化面板
                if (visualizationPanels[i]) {
                    gsap.to(visualizationPanels[i], { opacity: 1, duration: 0.5 });
                    visualizationPanels[i].classList.add('active');
                }
                break;
            }
        }
    }, 100));
}

// 初始化任务2的可视化内容
function initializeTask2Visualization() {
    // 初始化能耗构成饼图
    if (document.getElementById('energyPieChart')) {
        createEnergyPieChart();
    }
    
    // 初始化PUE滑块交互
    if (document.getElementById('pueSlider')) {
        setupPueSlider();
    }
    
    // 生成小房子图标
    if (document.getElementById('housesContainer')) {
        generateHouseIcons();
    }
}

// 创建能耗构成饼图
function createEnergyPieChart() {
    const ctx = document.createElement('canvas');
    document.getElementById('energyPieChart').appendChild(ctx);
    
    const initialPue = 1.46;
    const initialData = calculateEnergyBreakdown(initialPue);
    
    energyChart = new Chart(ctx, {
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
                    },
                    backgroundColor: 'rgba(15, 23, 42, 0.8)'
                }
            },
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            },
            // 调整图表尺寸
            cutout: '65%', // 增加环形空心部分的大小
            aspectRatio: 1.2 // 调整宽高比
        }
    });
    
    // 初始化后立即应用基于PUE值的颜色
    updateEnergyChart(initialPue);
}

// 设置PUE滑块交互
function setupPueSlider() {
    const pueSlider = document.getElementById('pueSlider');
    const pueValue = document.getElementById('pueValue');
    const pueInfo = document.getElementById('pueInfo');
    
    // 创建滑块标记
    createSliderMarkers();

    // 拖动过程中实时更新 - 使用节流但降低延迟以提高响应速度
    const throttledUpdate = throttle(updatePueDisplay, 5); // 提高更新频率
    
    // 确保input事件正确触发（主要事件）
    pueSlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        updatePueDisplay(value); // 不使用节流，确保实时响应
    });

    // 为了兼容性，也保留mousedown和touchstart事件，但使用相同的处理逻辑
    pueSlider.addEventListener('mousedown', function() {
        const handleMouseMove = () => {
            const value = parseFloat(pueSlider.value);
            throttledUpdate(value);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        
        // 确保在任何情况下都能移除事件监听器
        const cleanup = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', cleanup);
            document.removeEventListener('mouseleave', cleanup);
            
            // 添加最终动画效果
            gsap.to(pueValue, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 });
            gsap.to('.pie-chart-container', { 
                scale: 1.05,
                duration: 0.3,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
            });
        };
        
        document.addEventListener('mouseup', cleanup);
        document.addEventListener('mouseleave', cleanup);
    });

    // 触摸设备支持
    // pueSlider.addEventListener('touchstart', function(e) {
    //     e.preventDefault(); // 防止滚动
        
    //     const handleTouchMove = (e) => {
    //         e.preventDefault(); // 防止滚动
    //         const value = parseFloat(pueSlider.value);
    //         throttledUpdate(value);
    //     };
        
    //     document.addEventListener('touchmove', handleTouchMove, { passive: false });
        
    //     const cleanup = () => {
    //         document.removeEventListener('touchmove', handleTouchMove);
    //         document.removeEventListener('touchend', cleanup);
    //         document.removeEventListener('touchcancel', cleanup);
            
    //         // 添加最终动画效果
    //         gsap.to(pueValue, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 });
    //         gsap.to('.pie-chart-container', { 
    //             scale: 1.05,
    //             duration: 0.3,
    //             yoyo: true,
    //             repeat: 1,
    //             ease: "power2.inOut"
    //         });
    //     };
        
    //     document.addEventListener('touchend', cleanup);
    //     document.addEventListener('touchcancel', cleanup);
    // });

    // 初始化显示 - 确保页面加载时就显示正确的PUE值和家庭能耗对比
    updatePueDisplay(1.46);
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
    
    // 未选择部分保持固定的灰色
    const unselectedColor = '#444';
    
    // 确定已选择部分的颜色，使用平滑过渡的渐变效果
    // 计算当前PUE值在整个范围内的位置
    const rangePosition = (pueValue - 1.0) / (1.7 - 1.0);
    
    // 使用HSL颜色空间实现平滑的绿-黄-红渐变
    // 绿色(120°) -> 黄色(60°) -> 红色(0°)
    let hue;
    if (rangePosition <= 0.5) {
        // 绿色到黄色的过渡 (120° to 60°)
        hue = 120 - (rangePosition * 120);
    } else {
        // 黄色到红色的过渡 (60° to 0°)
        hue = 60 - ((rangePosition - 0.5) * 120);
    }
    
    // 饱和度随PUE值增加而略微增加，以增强视觉效果
    const saturation = 70 + (rangePosition * 30);
    
    // 设置亮度适中，确保颜色清晰可见
    const lightness = 60;
    
    // 构建最终的颜色
    const selectedColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    // 设置滑块背景渐变，在滑块位置分割两种颜色
    slider.style.background = `linear-gradient(to right, ${selectedColor} 0%, ${selectedColor} ${percentage}%, ${unselectedColor} ${percentage}%, ${unselectedColor} 100%)`;
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

// 更新PUE显示的函数
function updatePueDisplay(value) {
    const pueValue = document.getElementById('pueValue');
    const pueInfo = document.getElementById('pueInfo');
    
    if (pueValue) {
        pueValue.textContent = `PUE: ${value.toFixed(2)}`;
    }
    
    // 根据PUE值显示不同信息
    if (pueInfo) {
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

// 滚动进度指示器
function createScrollProgress() {
    const progressBar = document.getElementById('progressBar');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// 添加平滑滚动
function addSmoothScroll() {
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
}

// 响应式处理
function handleResize() {
    // 重新计算图表大小
    Chart.helpers.each(Chart.instances, function(chart) {
        chart.resize();
    });
}

window.addEventListener('resize', handleResize);

// 添加键盘导航支持
function addKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            e.preventDefault();
            window.scrollBy(0, window.innerHeight);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            window.scrollBy(0, -window.innerHeight);
        }
    });
}

// 节流函数，用于优化滚动事件
function throttle(func, delay) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, delay);
        }
    };
}