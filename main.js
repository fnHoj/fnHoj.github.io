// full就是按照iframe内部内容的高度，screen就使用window的高度
const /** @type {(null|'screen'|'full')[]} */ expand_mode = [null, `full`, `full`, `full`, `screen`, `screen`, `screen`, `screen`, `full`];

// 总共文档数量
const DOCS = expand_mode.length;

// 总共图的数量（无用）
const GRAPHS = 0 + 1;
// 无用
const bind_start = [null, 1, 3];
// 无用
const bind_end = [null, 2, 3];

// 是否把所有event产生的scrollBy需要的增量y先加起来，每隔一段时间一起scroll一次？
const SUM_DELTA_Y_AND_RELEASE_IN_TICKS = true;

// 章节
const chapters = [`序言`, `流动的能源`, `计算的能源`, `自然的能源`, `终极的能源`, `尾声`];

//    目录按钮的宽度(v1使用)   目录在未聚焦情况下多少毫秒后自动关闭
const MENU_BTN_WIDTH = 300, MENU_AUTO_CLOSE_T = 500;

// menu_targets [章节索引] -> 文档索引
const menu_targets = [1, 1, 5, 6, 7, 8];

// 拿来累计每个文档的滚动y
const docs_delta_y = new Array(DOCS).fill(0);

// 1 -> 左侧，2 -> 上侧
const MENU_VERSION = 2;

//    目录按钮的高度(v2使用)
const MENU_BTN_HEIGHT = 40;

const menu_box = MENU_VERSION === 1? document.createElement(`div`): null;
const menu = document.createElement(`div`);
if(MENU_VERSION === 1){
    menu.classList.add(`menu`);
}else{
    menu.classList.add(`menu2`);
}
if(MENU_VERSION === 1){
    menu_box.classList.add(`menu_rect`);
    menu_box.appendChild(menu);
    document.body.appendChild(menu_box);
}else{
    document.body.appendChild(menu);
}

let menu_closed = false, menu_last_opened = performance.now();

// 创建章节的按钮
for(let i = 0; i < chapters.length; ++i){
    const r = document.createElement(`div`);
    r.classList.add(MENU_VERSION === 1? `menu_btn`: `menu2_btn`);
    if(MENU_VERSION === 1){
        r.style.width = MENU_BTN_WIDTH + `px`;
    }else{
        r.style.height = MENU_BTN_HEIGHT + `px`;
        r.style.width = `${100 / chapters.length}vw`;
    }
    if(!i)
        r.classList.add(`top`);
    if(i === chapters.length - 1)
        r.classList.add(`bottom`);
    r.innerText = chapters[i];
    r.addEventListener(`click`, (e) => {
        goto(docs[menu_targets[i]]);
    });
    menu.appendChild(r);
}

// 判断打开与关闭章节
function check_menu_hitbox(){
    if(MENU_VERSION !== 1)
        return;
    const mono = (a, b, c) => a <= b && b <= c;
    if(mousex < MENU_BTN_WIDTH / 10 && mono(menu.offsetTop, mousey, menu.offsetTop + menu.offsetHeight) || 
       mousex < MENU_BTN_WIDTH / 15){
        menu_last_opened = performance.now();
        if(menu_closed){
            menu_closed = false;
            menu.classList.toggle(`closed`);
        }
    }
    if(mousex > MENU_BTN_WIDTH || !mono(menu.offsetTop, mousey, menu.offsetTop + menu.offsetHeight)){
        if(!menu_closed){
            if(performance.now() - menu_last_opened > MENU_AUTO_CLOSE_T){
                menu_closed = true;
                menu.classList.toggle(`closed`);
            }else{
                setTimeout(check_menu_hitbox, MENU_AUTO_CLOSE_T - performance.now() - menu_last_opened + 50);
            }
        }
    }
}

//    是否遮掩（无用）      是否输出鼠标信息        是否输出滚动信息
const USE_MASKS = false, OUTPUT_MOUSE = false, OUTPUT_SCROLL = false;

// 遮掩（无用），之前是拿来接收滚动的
const masks = new Array(DOCS).fill(0).map((_, i) => {
    // if(expand_mode[i] === `screen`){
        // const r = document.createElement(`div`);
        // document.body.appendChild(r);
        // r.style.width = `100vw`;
        // r.style.height = `100vh`;
        // r.style.padding = `0`;
        // r.style.margin = `0`;
        // r.style.position = `absolute`;
        // r.style.left = `0`;
        // r.style.border = `none`;
        // r.style.pointerEvents = `none`;
        // r.style.backgroundColor = `rgba(0, 255, 0, 0.5)`;
        // return r;
    // }
    return null;
});

// 无用
const BIND_PROG = [
    [],
    [
        [1, 0],
        [2, 0.7]
    ],
    [
        [3, 0]
    ]
];

// 所有文档的Iframe
const /** @type {(HTMLIFrameElement | null)[]} */ docs = new Array(DOCS).fill(0).map((_, i) => {
    return !i? null: document.getElementById(`doc${i}`);
});

// 所有交互图的Iframe（无用）
const /** @type {(HTMLIFrameElement | null)[]} */ graphs = new Array(GRAPHS).fill(0).map((_, i) => {
    return !i? null: document.getElementById(`graph${i}`);
});

// 无用
const h_start = new Array(GRAPHS).fill(Infinity), h_end = new Array(GRAPHS).fill(Infinity);

// 无用
const last_sent_prog = new Array(GRAPHS).fill(null);

// 无用
const /** @type {((number) => number)[]} */ prog_mappers = new Array(GRAPHS).fill(null);
for(let i = 1; i < GRAPHS; ++i)
    prog_mappers[i] = () => 0;

// 无用
function calc_h(){
    const start_h = (/** @type {number} */ idx) => docs[idx].offsetTop;
    const end_h = (/** @type {number} */ idx) => docs[idx].offsetTop + docs[idx].offsetHeight;
    for(let i = 0; i < GRAPHS; ++i){
        const s = !i? null: BIND_PROG[i][0][0], e = !i? null: BIND_PROG[i][BIND_PROG[i].length - 1][0];
        h_start[i] = !i? null: start_h(s);
        h_end[i] = !i? null: end_h(e) - graphs[i].offsetHeight;
        const d = [{i: 0, o: 0}]; // [input_prog, output_prog]
        for(let p of BIND_PROG[i]){
            const [idx, prog] = p;
            d.push({i: (start_h(idx) - h_start[i]) / (h_end[i] - h_start[i]), o: prog});
        }
        d.push({i: 1, o: 1});
        prog_mappers[i] = (/** @type {number} */ p) => {
            for(let i = 1; i < d.length; ++i)
                if(p <= d[i].i)
                    return d[i - 1].o + (p - d[i - 1].i) / (d[i].i - d[i - 1].i) * (d[i].o - d[i - 1].o);
            throw Error(`what is this`);
        };
    }
}

// 更新文档的高度
function update_doc_height(/** @type {number} */ idx) {
    let /** @type {HTMLIFrameElement} */ d = docs[idx];
    if(!d)
        return;
    d.style.height = expand_mode[parseInt(d.id.replace(`doc`, ``))] === `full`
        ? d.contentWindow.document.documentElement.offsetHeight + 'px'
        : `100vh`;
}

// 无用
function update_masks(){
    // for(let i = 1; i < docs.length; ++i){
        // if(expand_mode[i] === `screen`){
            // masks[i].style.top = docs[i].offsetTop + `px`;
        // }
    // }
}

// 更新所有的排版
function update_docs(){
    for(let i = 0; i < docs.length; ++i)
        update_doc_height(i);
    calc_h();
    update_graphs();
    update_masks();
}

// 更新图的坐标模式（无用）
function update_graphs(){
    const scroll = window.scrollY;
    for(let i = 1; i < GRAPHS; ++i){
        let new_prog = null;
        if(h_start[i] < scroll && scroll < h_end[i]){
            if(graphs[i].classList.contains(`relative`))
                graphs[i].classList.remove(`relative`);
            new_prog = prog_mappers[i]((scroll - h_start[i]) / (h_end[i] - h_start[i]));
            graphs[i].style.top = `0`;
        }else{
            if(!graphs[i].classList.contains(`relative`))
                graphs[i].classList.add(`relative`);
            graphs[i].style.top = (scroll < h_end[i]? h_start[i]: h_end[i]) + `px`;
            new_prog = scroll < h_end[i]? 0: 1;
        }
        if(new_prog !== last_sent_prog[i]){
            graphs[i].contentWindow.postMessage({ prog: new_prog });
            last_sent_prog[i] = new_prog;
        }
    }
}

//  上一次滚动在哪里    是否改变了滚动（无用）
let last_scroll = 0, changed_scroll = false;

// 更新滚动 (dy = 需要增加的y)
function scroll_update(/** @type {number} */ dy){
    // 将 dy 拆成小于 10px 的块，确保没有bug
    if(Math.abs(dy) > 10){
        let slices = Math.trunc(Math.ceil(Math.abs(dy) / 10));
        // console.log(`${dy} -> ${dy / slices} x ${slices}`);
        for(let i = 0; i < slices; ++i)
            scroll_update(dy / slices);
        return;
    }

    // 新的滚动位置（计划的）
    let now_scroll = last_scroll + dy;

    // if(changed_scroll){
    //     update_graphs();
    //     changed_scroll = false;
    //     last_scroll = now_scroll;
    //     return;
    // }
    update_graphs();

    // 最终的滚动位置（循环之后才得到真正的值）
    let target_now_scroll = now_scroll;
    // 事实上的鼠标y（考虑了滚动）
    let mp = now_scroll + mousey;
    
    // console.log(`actual mouse position-y should be @${mp}`);
    for(let i = 1; i < DOCS; ++i){

        // 如果一个文档使用了屏幕大小的高度模式，需要考虑滚动的问题
        if(expand_mode[i] === `screen`){
            // if(
            //     last_scroll < now_scroll &&
            //     last_scroll < docs[i].offsetTop &&
            //     now_scroll >= docs[i].offsetTop
            // ){
            //     window.scrollTo(0, docs[i].offsetTop);
            //     console.log(`clamp`, last_scroll, now_scroll);
                
            // }

            // 如果在当前鼠标滚动的y在Iframe区间中
            if(docs[i].offsetTop < mp && mp < docs[i].offsetTop + docs[i].offsetHeight){
                // console.log(`here <${docs[i].offsetTo/p} -> ${docs[i].offsetTop + docs[i].offsetHeight}> has ${mp}`);

                const nw = docs[i].contentWindow.window, sh = nw.document.body.scrollHeight - docs[i].offsetHeight;
                if(
                    // 往下滚                 && 这个文档没滚到底部 && 鼠标在Iframe中（iframe已经完全展现）
                    now_scroll > last_scroll && nw.scrollY < sh && now_scroll >= docs[i].offsetTop ||
                    // 往上滚                 && 这个文档没滚到顶部 && 鼠标不在Iframe中（已经到iframe的顶端）
                    now_scroll < last_scroll && nw.scrollY > 0  && now_scroll <= docs[i].offsetTop
                ){ // 需要把滚动body转换成滚动Iframe
                    // console.log(nw.scrollY, sh, `∆y=${now_scroll - last_scroll}`);
                    // window.scrollTo(0, docs[i].offsetTop);
                    // document.body.scrollTop = docs[i].offsetTop;
                    // console.log(`${document.documentElement.scrollTop} == ${docs[i].offsetTop}?`);
                    // changed_scroll = true;
                    
                    const de = docs[i].contentDocument.documentElement;

                    // console.log(`before:`, de.scrollTop);
                    // de.scrollTop = de.scrollTop + now_scroll - last_scroll;

                    // 把增量记录到docs_delta_y中还是直接scrollBy掉（两种模式）
                    if(SUM_DELTA_Y_AND_RELEASE_IN_TICKS)
                        docs_delta_y[i] += now_scroll - last_scroll;
                    else
                        nw.scrollBy(0, now_scroll - last_scroll);
                    // console.log(`after:`, de.scrollTop);
                    
                    // 目标滚动改成这个Iframe的顶部
                    target_now_scroll = docs[i].offsetTop;
                    // masks[i].hidden = true;
                }else{
                    // if(now_scroll < last_scroll)
                    //     console.log(`reject ${} ${} ${}`);
                    // masks[i].hidden = false;
                }
            }
        }
    }
    // 处理边界
    now_scroll = Math.max(0, Math.min(document.documentElement.scrollHeight - window.innerHeight, target_now_scroll));
    // 更新滚动
    document.documentElement.scrollTop = now_scroll;
    last_scroll = now_scroll;
}

// 无用
let sec = 1, hs = new Array(DOCS).fill(Infinity);

// 记录鼠标(x,y)
let mousex = window.innerWidth / 2, mousey = window.innerHeight / 2;

// 监听鼠标坐标（在body的范畴内）
document.addEventListener(`mousemove`, (e) => {
    mousex = e.x;
    mousey = e.y;
    if(OUTPUT_MOUSE)
        console.log(`${mousey} @main`);
    check_menu_hitbox();
});

// document.addEventListener(`scroll`, (e) => {
//     console.log(window.scrollY);
//     scroll_update(e);
// });

// const /** @type {HTMLDivElement} */ foreground = document.getElementById(`foreground`);
// console.log(foreground);

// 监听滚动事件
window.addEventListener(`wheel`, (e) => {
    if(OUTPUT_SCROLL)
        console.log(`a`, window.scrollY);
    e.preventDefault();
    scroll_update(e.deltaY);
}, { passive: false });

// foreground.addEventListener(`wheel`, (e) => {
//     console.log(`yes`);
//     e.preventDefault();
// });

// 在Iframe中添加滚动和鼠标位置的监听器
function add_messy_listeners(/** @type {HTMLIFrameElement} */ d){
    console.log(`added event listener`);
    d.contentWindow.addEventListener(`wheel`, (e) => {
        if(OUTPUT_SCROLL)
            console.log(e.deltaY);
        e.preventDefault();
        e.stopPropagation();
        scroll_update(e.deltaY);
    }, { passive: false });
    d.contentWindow.addEventListener(`mousemove`, (e) => {
        mousex = e.x;
        mousey = e.y + d.offsetTop - window.scrollY;
        if(OUTPUT_MOUSE)
            console.log(`${mousey} @${d.id}`);
        check_menu_hitbox();
    });
    // d.contentDocument.body.addEventListener(`wheel`, (e) => {
    //     console.log(d);
    //     e.preventDefault();
    //     e.stopPropagation();
    //     scroll_update(e.deltaY);
    // }, { passive: false });
}

// 如果窗口大小改变，更新所有布局
addEventListener("resize", update_docs);

// 初始的刷新文档高度
docs.forEach((d) => {
    if (!d)
        return;
    if (d.contentWindow.document.readyState === "interactive"){
        update_doc_height(d);
        add_messy_listeners(d);
    }else
        d.contentWindow.addEventListener("load", () => {
            update_doc_height(d);
            add_messy_listeners(d);
            d.contentWindow.document.body.style.overflow = `hidden`;
        });
});
// 额外的刷新
setTimeout(update_docs, 100);
setTimeout(update_docs, 200);
// 冗余的刷新
setInterval(update_docs, 2000);

// 跳转到一个地方（由于第一部分，无法做到瞬间，为避免阻塞，每一帧只移动4000个px）
function goto(/** @type {HTMLIFrameElement} */ element){
    // while(true){
    let rstate = window.scrollY < element.offsetTop;
    function f(){
        for(let i = 0; i < 1000; ++i){
            if(rstate)
                scroll_update(4);
            else
                scroll_update(-4);
            if(rstate && window.scrollY > element.offsetTop - 5 || !rstate && window.scrollY < element.offsetTop)
                // break;
                return;
        }
        requestAnimationFrame(f);
    }
    // }
    requestAnimationFrame(f);
}

// function whatever(){
//     let r = [];
//     for(let i = 1; i < docs.length; ++i)
//         r.push(docs[i].offsetTop);
//     console.log(r);
// }

// setInterval(whatever, 500);

// 滚动更新的轮回，每几帧更新一次滚动
let we = 0, step = 1;

// 更新滚动
function scroll_all(){
    we = (we + 1) % step;
    // 如果正好是每step的第一帧
    if(!we){
        // 更新滚动，释放累计的docs_delta_y
        for(let i = 0; i < DOCS; ++i)
            if(docs_delta_y[i] !== 0){
                console.log(`∆[${i}] = ${docs_delta_y[i]}`);
                docs[i].contentWindow.scrollBy(0, docs_delta_y[i]);
            }
        for(let i = 0; i < DOCS; ++i)
            docs_delta_y[i] = 0;
    }
    requestAnimationFrame(scroll_all);
}

requestAnimationFrame(scroll_all);