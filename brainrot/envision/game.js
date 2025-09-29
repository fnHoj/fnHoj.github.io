import {Timer} from "./timer.js";
import {load} from "./data.js";
import {power} from "./power.js";

const deg = Math.PI / 180;
const /** @type {HTMLDivElement} */ turbine = document.getElementById("turbine");
const /** @type {HTMLDivElement} */ notes_screen = document.getElementById("notes");
const /** @type {HTMLDivElement[]} */ notes = new Array(notes_screen.children.length).fill().map((_, i) => notes_screen.children[i]);
const /** @type {HTMLParagraphElement} */ total = document.getElementById("total");
const /** @type {HTMLParagraphElement} */ combop = document.getElementById("combo");
const /** @type {HTMLDivElement} */ judgement = document.getElementById("judgement");;
const /** @type {HTMLParagraphElement[]} */ judgements = new Array(judgement.children.length).fill().map((_, i) => judgement.children[i]);
const /** @type {HTMLParagraphElement} */ date = document.getElementById("date");
const duration = 100;
const timer = new Timer(-4000);
var /** @type {{ts: Date, spd: number, deg: number}[]} */ data = [];

const turbineR = 80;
const kVel = 0.16;
const paddleRadius = 35 / 360;

var angl = 0;
var energy = 0;
var previ0 = -notes.length;
var combo = 0;
var combo_broken = false;

class JudgeRecord {
	/** @type {number} */ score;
	/** @type {Timer} */ timer;
	constructor(/** @type {number} */ score = 0, /** @type {Timer} */ timer = new Timer()) {
		this.score = score;
		this.timer = timer;
	}
}
const /** @type {JudgeRecord[]} */ judge_records = new Array(judgements.length).fill(new JudgeRecord(0, new Timer(-Infinity)));

function radius(/** @type {number} */ spd) {
	return 30 + 4 * spd;
}

function format_date(/** @type {Date} */ d) {
	return `${d.getFullYear().toString().padStart(4, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:00`;
}
function judge(/** @type {number} */ i) {
	if (i < 0 || i >= data.length)
		return -1;
	date.textContent = format_date(data[i].ts);
	if (data[i].spd < 3)
		return -1;
	let diff = (angl / deg - data[i].deg) / 360;
	diff -= Math.round(diff);
	if (diff >= -paddleRadius && diff <= paddleRadius)
		return 1;
	return 0;
}
function generate(/** @type {number} */ i) {
	switch (judge(i)) {
		case 0:
			judge_records.shift();
			judge_records.push(new JudgeRecord());
			combo_broken = true;
			break;
		case 1:
			const p = power(data[i].spd)
			judge_records.shift();
			judge_records.push(new JudgeRecord(p));
			energy += p;
			if (combo_broken) {
				combo_broken = false;
				combo = 1;
			}
			else
				combo++;
			break;
		default:
			return;
	}
}

function posmod(a, b) {
	if ((a %= b) < 0)
		return a + b;
	return a;
}
function render_note(/** @type {HTMLDivElement} */ e, /** @type {number} */ i) {
	if (i < 0 || i >= data.length) {
		e.style.display = "none";
		return;
	}
	const d = data[i];
	const R = radius(d.spd);
	let lvl = Math.floor(d.spd / 2);
	if (lvl < 0)
		lvl = 0;
	if (lvl > 12)
		lvl = 12;
	e.style.display = "block";
	e.style.setProperty("--r", `${R}px`);
	e.style.backgroundImage = `url(assets/${d.spd < 3 ? "breeze" : "wind"}${lvl}.svg)`;
	e.style.transform = `rotate(${d.deg}deg)`;
}
function set_pos(/** @type {HTMLDivElement} */ e, /** @type {number} */ i, /** @type {number} */ t = timer.t()) {
	if (i < 0 || i >= data.length)
		return;
	const d = data[i];
	const R = radius(d.spd);
	const r = turbineR + R + kVel * d.spd * (duration * (i) - t);
	const angl = d.deg * deg;
	e.style.left = `${r * Math.sin(angl) - R}px`;
	e.style.top = `${-r * Math.cos(angl) - R}px`;
}
function render_notes(/** @type {number} */ t = timer.t()) {
	const i0 = Math.ceil((t - 16) / duration);
	if (previ0 < i0) {
		const i = previ0 + notes.length;
		const e = notes[posmod(previ0, notes.length)];
		render_note(e, i);
		set_pos(e, i, t);
		generate(previ0);
		previ0 = i0;
	}
	for (let i = 0; i < notes.length; i++) {
		set_pos(notes[posmod(i0 + i, notes.length)], i0 + i, t);
	}
}

function orient(/** @type {number} */angl1) {
	turbine.style.transform = `rotate(${angl = angl1}rad)`;
}
function orient_to(e, c) {
	orient(Math.atan2(e.clientX - c.x, c.y - e.clientY));
}

function render() {
	render_notes();
	total.textContent = `${energy} kWh`;
	combop.textContent = combo;
	if (combo_broken)
		combop.classList.add("broken");
	else
		combop.classList.remove("broken");
	judgements.forEach((para, i) => {
		let t = judge_records[i].timer.t() / duration;
		if (isFinite(t) && t < 1)
			t = 0;
		let opacity = 1 - t / judgements.length;
		if (!isFinite(opacity) || opacity <= 0)
			opacity = 0;
		if (judge_records[i].score) {
			para.classList.remove("miss");
			para.textContent = `+${judge_records[i].score} kWh`;
		}
		else {
			para.classList.add("miss");
			para.textContent = "MISS!";
		}
		para.style.opacity = opacity;
		para.style.top = `${t * t * 5}px`;
	});
}
function frame() {
	render();
	requestAnimationFrame(frame);
}

export async function beatmap_init(path = "../wind.csv", offset = -4000) {
	data = await load(path);
	timer.set(offset);
}

export async function game_init() {
	addEventListener("blur", () => timer.pause());
	addEventListener("click", () => {
		if (timer.paused)
			timer.resume();
		else
			timer.pause();
	});
	addEventListener("mousemove", (e) => {
		orient_to(e, notes_screen.getClientRects()[0]);
	});
	addEventListener("touchstart", (e) => {
		orient_to(e.changedTouches[0], notes_screen.getClientRects()[0]);
	});
	addEventListener("touchmove", (e) => {
		orient_to(e.changedTouches[0],notes_screen.getClientRects()[0] );
	});
	frame();
}