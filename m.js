const DOCS = 7 + 1;
const /** @type {(null|'screen'|'full')[]} */expand_mode = [null, `full`, `full`, `full`, `screen`, `screen`, `screen`, `full`];
const GRAPHS = 0 + 1;
const bind_start = [null, 1, 3];
const bind_end = [null, 2, 3];

const USE_MASKS = false, OUTPUT_MOUSE = true, OUTPUT_SCROLL = false;

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

const /** @type {(HTMLIFrameElement | null)[]} */ docs = new Array(DOCS).fill(0).map((_, i) => {
    return !i? null: document.getElementById(`doc${i}`);
});

const /** @type {(HTMLIFrameElement | null)[]} */ graphs = new Array(GRAPHS).fill(0).map((_, i) => {
    return !i? null: document.getElementById(`graph${i}`);
});
const h_start = new Array(GRAPHS).fill(Infinity), h_end = new Array(GRAPHS).fill(Infinity);
const last_sent_prog = new Array(GRAPHS).fill(null);
const /** @type {((number) => number)[]} */ prog_mappers = new Array(GRAPHS).fill(null);
for(let i = 1; i < GRAPHS; ++i)
    prog_mappers[i] = () => 0;

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
function update_doc_height(/** @type {number} */ idx) {
    let /** @type {HTMLIFrameElement} */ d = docs[idx];
    if(!d)
        return;
    d.style.height = expand_mode[parseInt(d.id.replace(`doc`, ``))] === `full`
        ? d.contentWindow.document.documentElement.offsetHeight + 'px'
        : `100vh`;
}
function update_masks(){
    // for(let i = 1; i < docs.length; ++i){
        // if(expand_mode[i] === `screen`){
            // masks[i].style.top = docs[i].offsetTop + `px`;
        // }
    // }
}
function update_docs(){
    for(let i = 0; i < docs.length; ++i)
        update_doc_height(i);
    calc_h();
    update_graphs();
    update_masks();
}
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

let last_scroll = 0, changed_scroll = false;
function scroll_update(/** @type {number} */ dy){
    let now_scroll = last_scroll + dy;
    // if(changed_scroll){
    //     update_graphs();
    //     changed_scroll = false;
    //     last_scroll = now_scroll;
    //     return;
    // }
    update_graphs();
    let target_now_scroll = now_scroll;
    let mp = now_scroll + mousey;
    // console.log(`actual mouse position-y should be @${mp}`);
    for(let i = 1; i < DOCS; ++i){
        if(expand_mode[i] === `screen`){
            // if(
            //     last_scroll < now_scroll &&
            //     last_scroll < docs[i].offsetTop &&
            //     now_scroll >= docs[i].offsetTop
            // ){
            //     window.scrollTo(0, docs[i].offsetTop);
            //     console.log(`clamp`, last_scroll, now_scroll);
                
            // }
            if(docs[i].offsetTop < mp && mp < docs[i].offsetTop + docs[i].offsetHeight){
                // console.log(`here <${docs[i].offsetTo/p} -> ${docs[i].offsetTop + docs[i].offsetHeight}> has ${mp}`);
                const nw = docs[i].contentWindow.window, sh = nw.document.body.scrollHeight - docs[i].offsetHeight;
                if(
                    now_scroll > last_scroll && nw.scrollY < sh && now_scroll >= docs[i].offsetTop ||
                    now_scroll < last_scroll && nw.scrollY > 0 && now_scroll <= docs[i].offsetTop
                ){
                    // console.log(nw.scrollY, sh, `∆y=${now_scroll - last_scroll}`);
                    // window.scrollTo(0, docs[i].offsetTop);
                    // document.body.scrollTop = docs[i].offsetTop;
                    // console.log(`${document.documentElement.scrollTop} == ${docs[i].offsetTop}?`);
                    // changed_scroll = true;
                    nw.scrollBy(0, now_scroll - last_scroll);
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
    now_scroll = Math.max(0, Math.min(document.documentElement.scrollHeight - window.innerHeight, target_now_scroll));
    document.documentElement.scrollTop = now_scroll;
    last_scroll = now_scroll;
}

let sec = 1, hs = new Array(DOCS).fill(Infinity);

let mousex = -1, mousey = -1;
document.addEventListener(`mousemove`, (e) => {
    mousex = e.x;
    mousey = e.y;
    if(OUTPUT_MOUSE)
        console.log(`${mousey} @main`);
});

// document.addEventListener(`scroll`, (e) => {
//     console.log(window.scrollY);
//     scroll_update(e);
// });

const /** @type {HTMLDivElement} */ foreground = document.getElementById(`foreground`);
console.log(foreground);

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
    });
    // d.contentDocument.body.addEventListener(`wheel`, (e) => {
    //     console.log(d);
    //     e.preventDefault();
    //     e.stopPropagation();
    //     scroll_update(e.deltaY);
    // }, { passive: false });
}

addEventListener("resize", update_docs);
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
setTimeout(update_docs, 100);