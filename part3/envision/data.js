export async function load(path = "../wind.csv") {
	return (await (await fetch(path)).text()).split("\n").slice(1).map((d) => {
		let s = d.split(",");
		return {
			ts: new Date(s[0]),
			spd: Number.parseFloat(s[1]),
			deg: Number.parseFloat(s[2])
		};
	});
}