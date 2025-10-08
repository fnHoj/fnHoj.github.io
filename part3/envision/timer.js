export class Timer {
	/** @type {number} */ d0;
	/** @type {boolean} */ paused;
	constructor(/** @type {number} */ t0 = 0, /** @type {boolean} */ paused = false, /** @type {number} */ d0 = performance.now()) {
		if (paused)
			this.d0 = t0;
		else
			this.d0 = d0 - t0;
		this.paused = paused;
	}
	reset() {
		if (this.paused)
			this.d0 = 0;
		else
			this.d0 = performance.now();
	}
	set(/** @type {number} */ t0 = 0) {
		if (this.paused)
			this.d0 = t0;
		else
			this.d0 = performance.now() - t0;
	}
	t() {
		if (this.paused)
			return this.d0;
		return performance.now() - this.d0;
	}
	pause() {
		if (this.paused)
			return;
		this.d0 = performance.now() - this.d0;
		this.paused = true;
	}
	resume() {
		if (!this.paused)
			return;
		this.d0 = performance.now() - this.d0;
		this.paused = false;
	}
}