function RGBToHEX(r, g, b) {
	const padZero = num => ("00" + num.toString(16)).substr(-2, 2)
	return `#${padZero(r)}${padZero(g)}${padZero(b)}`
}

function HEXToRGB(hex) {
	const sliced = hex.slice(1)
	return [
		parseInt(sliced.slice(0, 2), 16),
		parseInt(sliced.slice(2, 4), 16),
		parseInt(sliced.slice(4, 6), 16)
	]
}

function RGBToHSL(r, g, b) {
	r /= 255
	g /= 255
	b /= 255

	const cmin = Math.min(r, g, b)
	const cmax = Math.max(r, g, b)
	const delta = cmax - cmin

	let h = 0, s = 0, l = 0

	if (delta === 0)
		h = 0
	else if (cmax === r)
		h = ((g - b) / delta) % 6
	else if (cmax === g)
		h = (b - r) / delta + 2
	else
		h = (r - g) / delta + 4

	h = Math.round(h * 60)

	if (h < 0)
		h += 360

	l = (cmax + cmin) / 2
	s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

	s = +(s * 100).toFixed(1)
	l = +(l * 100).toFixed(1)

	return [h, s, l]
}

function HSLToRGB(h, s, l) {
	s /= 100
	l /= 100

	let c = (1 - Math.abs(2 * l - 1)) * s,
		x = c * (1 - Math.abs((h / 60) % 2 - 1)),
		m = l - c/2,
		r = 0,
		g = 0,
		b = 0;

	if (0 <= h && h < 60) {
		r = c; g = x; b = 0;
	} else if (60 <= h && h < 120) {
		r = x; g = c; b = 0;
	} else if (120 <= h && h < 180) {
		r = 0; g = c; b = x;
	} else if (180 <= h && h < 240) {
		r = 0; g = x; b = c;
	} else if (240 <= h && h < 300) {
		r = x; g = 0; b = c;
	} else if (300 <= h && h < 360) {
		r = c; g = 0; b = x;
	}
	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	return [r, g, b]
}

function complement(r, g, b) {
	let [h, s, l] = RGBToHSL(r, g, b)
	return HSLToRGB((h + 180) % 360, s, l)
}

function dist(c1, c2) {
	return Math.sqrt(Math.pow((c1[0] - c2[0]), 2) + Math.pow((c1[1] - c2[1]), 2), Math.pow((c1[2] - c2[2]), 2))
}

function compScore(rgb1, rgb2) {
	const comp = complement(...rgb1)
	const maxDist = dist(comp, [0, 0, 0])

	return Math.round((1 - dist(comp, rgb2) / maxDist) * 100)
}

function monoScore(rgb1, rgb2) {
	const hsl1 = RGBToHSL(...rgb1)
	const hsl2 = RGBToHSL(...rgb2)
	const maxDist = dist([hsl1[0], 0, hsl1[2]], [0, 0, 0])

	return Math.round((1 - dist([hsl1[0], 0, hsl1[2]], [hsl2[0], 0, hsl2[2]]) / maxDist) * 100)
}

const RGBMap = {
	'??????': [100, 130, 170],
	'????????? ??????': [117, 192, 227],
	'?????????': [25, 50, 242],
	'??????': [255, 255, 255],
	'??????': [85, 101, 125],
	'??????': [156, 156, 155],
	'????????????': [255, 255, 241],
	'?????????': [0, 0, 0],
	'??????': [41, 58, 83],
	'????????????': [227, 195, 138],
	'??????': [33, 35, 34],
	'??????': [91, 90, 62],
	'?????????': [5, 33, 94],
	'?????????': [71, 21, 104],
	'????????? ??????': [243, 168, 183],
	'??????': [198, 180, 153],
	'????????????': [199, 77, 99],
	'?????? ?????????': [84, 86, 91],
	'?????? ?????????': [177, 83, 32],
	'?????????': [160, 127, 197],
	'?????????': [227, 58, 155],
	'??????': [86, 168, 54],
	'????????? ?????????': [226, 123, 47],
	'??????': [103, 190, 172]
}

/**
 * Convert a Korean color string to hex representation
 * @param {string} color name of color in Korean. refer to the variable `RGBMap` for the specific names
 */
export function toRGB(color) {
	if(typeof color === 'object')
		return color.hex;

	if (!(RGBMap.hasOwnProperty(color)))
		return '#FFFFFF'

	return RGBToHEX(...RGBMap[color])
}

export function normalizeColor(color, target = colors) {
	if(typeof color !== 'object')
		return color;

	const [r, g, b] = color.rgba ? Object.values(color.rgba) : HEXToRGB(color.hex);

	const { value } = target
		.reduce((minDistance, key) => {
			const [r1, g1, b1] = RGBMap[key];
			const distance = Math.hypot(r - r1, g - g1, b - b1);

			if(minDistance.distance > distance)
				return { distance, value: key };

			return minDistance;
		}, { distance: Infinity, value: null });

	return value;
}

/**
 * Returns the color match score of two colors
 * @param {string} color1 name of color in Korean. refer to the variable `RGBMap` for the specific names
 * @param {string} color2 name of color in Korean. refer to the variable `RGBMap` for the specific names
 */
export function colorMatchScore(color1, color2) {
	if(color1 === color2)
		return 30;

	if(color1 === '?????????' || color2 === '?????????') {
		return 70;
	}

	if (!(RGBMap.hasOwnProperty(color1) && RGBMap.hasOwnProperty(color2)))
		return 0

	const rgb1 = RGBMap[color1]
	const rgb2 = RGBMap[color2]

	const comp = compScore(rgb1, rgb2)
	const mono = monoScore(rgb1, rgb2)
	return Math.max(0, Math.max(comp, mono))
}


export function colorMatchScoreMulti(colors) {
	if(colors.length < 2)
		return 0;

	const scores = [];
	colors.forEach((color1, index) => {
		for (let i = index + 1; i < colors.length; i++) {
			const color2 = colors[i];
			scores.push(colorMatchScore(color1, color2));
		}
	});

	return Math.floor(scores.reduce((prev, curr) => prev + curr, 0) / scores.length);
}

const getHSLVal = (num, step = 1) => color =>
	!RGBMap.hasOwnProperty(color) ?
		0 :
		Math.floor(RGBToHSL(...RGBMap[color])[num] / step);

const getHue = getHSLVal(0);
const getLightness = getHSLVal(2);

export function sortColor(color1, color2) {
	const lightDiff = getLightness(color1) - getLightness(color2);
	if(lightDiff !== 0)
		return Math.sign(lightDiff);

	return Math.sign(getHue(color1) - getHue(color2));
}

export const colors = Object.keys(RGBMap)
	.sort(sortColor);
